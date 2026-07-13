import os
import json
import gzip
import asyncio
from datetime import datetime
from abc import ABC, abstractmethod
import logging
import httpx
from typing import List, Union, Optional
import db

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

class BaseMarketDataAdapter(ABC):
    def __init__(self, provider_name: str, config: dict, market_event: asyncio.Event, pools: dict, db_ctx: Optional[dict] = None):
        self.provider_name = provider_name
        self.config = config
        self.market_event = market_event
        self.pools = pools

        self.database_service = db_ctx or {} # empty in flat file mode

        # Pull timing constraints from the calibrated YAML
        self.seconds_per_request = config.get("seconds_per_request", 1.0)
        self.base_url = config.get("base_url")
        self.run_during_market_close = config.get("run_during_market_close", False)

        # Target directory configuration for our flat-file lake
        self.storage_root = os.getenv("DATA_LAKE_ROOT", "./storage/raw_harvest")

    def _get_compressed_file_path(self, asset_class: str) -> str:
        now = datetime.now()
        partition_dir = os.path.join(
            self.storage_root,
            f"provider={self.provider_name}",
            f"asset_class={asset_class}",
            f"year={now.strftime('%Y')}",
            f"month={now.strftime('%m')}"
        )
        os.makedirs(partition_dir, exist_ok=True)
        return os.path.join(partition_dir, f"day={now.strftime('%d')}.jsonl.gz")

    def save_to_lake(self, asset_class: str, payload: Union[dict, list]):
        file_path = self._get_compressed_file_path(asset_class)

        envelope = {
            "harvested_at": datetime.now().isoformat() + "Z",
            "raw_payload": payload
        }

        with gzip.open(file_path, "at", encoding="utf-8") as f:
            f.write(json.dumps(envelope) + "\n")

    async def _route_to_db(self, asset_type: str, symbols: List[str], payload: Union[dict, list]):
        """
        DB_MODE path: normalize raw payload -> rows via transform_payload
        (per-provider, implemented downstream), resolve asset_id lazily
        through the shared cache, then push each row onto whichever lane
        this asset_class is configured for.

        transform_payload must return a list of dicts, each carrying:
          - "symbol": str
          - "table": "realtimeticks" | "dailyohlcv"
          - "timestamp": datetime
          - the value columns for that table (price/volume, or open/high/low/close/volume)
          - optional "exchange" / "currency" overrides (default UNKNOWN/USD)
        """
        rows = await self.transform_payload(asset_type, symbols, payload)
        if not rows:
            return

        asset_cache: db.AssetCache = self.database_service["asset_cache"]
        lane = self.config["asset_classes"][asset_type].get("lane", "slow")
        target_queue = self.database_service["fast_queue"] if lane == "fast" else self.database_service["slow_queue"]

        for row in rows:
            symbol = row.pop("symbol")
            exchange = row.pop("exchange", "UNKNOWN")
            currency = row.pop("currency", "USD")
            table = row.pop("table")

            row["asset_id"] = await asset_cache.get_or_create_asset_id(
                symbol=symbol, asset_class=asset_type, exchange=exchange, currency=currency
            )
            await target_queue.put((table, row))

    async def fetch_and_store(self, index:int):
        asset_type: str = [name for name, enabled in self.config["asset_classes"].items() if enabled][index]
        symbols = await self.get_symbol_batch(asset_type)
        if not symbols:
            logging.info("No symbols to request")
            return

        async with httpx.AsyncClient() as client:
            try:
                response = await self.make_request(client, symbols, asset_type)

                if response.status_code == 200:
                    payload = response.json()
                    if payload:
                        if db.DB_MODE:
                            await self._route_to_db(asset_type, symbols, payload)
                        else:
                            self.save_to_lake(asset_class=asset_type, payload=payload)
                elif response.status_code == 429:
                    logging.info(f"WARN: Rate limit exceeded on {self.provider_name}. Pacing window check required.")
                else:
                    response.raise_for_status()
            except Exception as e:
                logging.exception(f"ERROR: Failed to make request for {self.provider_name}: {str(e)}")

    @abstractmethod
    async def make_request(self, client, symbols: list[str], asset: str):
        pass

    @abstractmethod
    async def transform_payload(self, asset_class: str, symbols: list[str], payload) -> list[dict]:
        pass

    async def get_symbol_batch(self, asset:str) -> List[str]:
        # henceforth [0] is the key/asset type and [1] is whether it is enabled

        batch_limit = self.config["rest"]["batch_limits"].get(asset, 1)
        symbols = await self.pools[asset].dequeue_batch(batch_limit)

        if not symbols:
            logging.error(f"{asset} config.yaml asset_classes entry could not be parsed.")
            return []
        return symbols

    async def run_harvest_loop(self):
        logging.info(f"Starting harvest loop for {self.provider_name}...")
        counter = 0
        num_enabled_assets = len([name for name, enabled in self.config["asset_classes"].items() if enabled])

        if not self.run_during_market_close:
            while True:
                await self.market_event.wait() #check if the market is open, wait if not

                start_time = asyncio.get_event_loop().time()
                try:
                    await self.fetch_and_store(counter)
                except Exception as e:
                    logging.exception(f"Error: {e}")

                elapsed = asyncio.get_event_loop().time() - start_time
                sleep_time = max(0, self.seconds_per_request - elapsed)
                counter= (counter+1) % num_enabled_assets
                await asyncio.sleep(sleep_time)
        else:
            while True:
                start_time = asyncio.get_event_loop().time()
                try:
                    await self.fetch_and_store(counter)
                except Exception as e:
                    logging.exception(f"Error: {e}")

                elapsed = asyncio.get_event_loop().time() - start_time
                sleep_time = max(0, self.seconds_per_request - elapsed)
                counter= (counter+1) % num_enabled_assets
                await asyncio.sleep(sleep_time)

class TickerRingBuffer:
    """
    A concurrency-safe circular pointer structure that rotates
    ticker slices across parallel API workers.
    """
    def __init__(self, tickers: List[str]):
        self.tickers = tickers
        self._index = 0
        self._lock = asyncio.Lock()  # Prevents parallel workers from grabbing the same tickers

    async def dequeue_batch(self, batch_size: int) -> List[str]:
        if not self.tickers:
            return []

        async with self._lock:
            batch = []

            total_tickers = len(self.tickers)

            if total_tickers == 0:
                return batch

            effective_limit = min(batch_size, total_tickers)

            for _ in range(effective_limit):
                batch.append(self.tickers[self._index])
                # Circular rotation loop
                self._index = (self._index + 1) % len(self.tickers)
            return batch