import os
import json
import gzip
import asyncio
from datetime import datetime
from abc import ABC, abstractmethod
import logging
import aiofiles
from typing import List, Union

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

class BaseMarketDataAdapter(ABC):
    def __init__(self, provider_name: str, config: dict, market_event:asyncio.Event, pools:dict):
        self.provider_name = provider_name
        self.config = config
        self.market_event = market_event
        self.pools = pools

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

    @abstractmethod
    async def fetch_and_store(self, index:int):
        pass

    async def get_symbol_batch(self, index: int) -> List[str]:
        asset_type = list(self.config["asset_classes"].items())[index]
        # henceforth [0] is the key/asset type and [1] is whether it is enabled

        if not isinstance(asset_type[0], str) or not isinstance(asset_type[1], bool):
            print(f"ERROR: {self.provider_name} config.yaml asset_classes entry could not be parsed.")
            return []

        if "stocks" != asset_type[0] or asset_type[1] is False:
            return []

        batch_limit = self.config["rest"]["batch_limits"].get(asset_type[0], 1)
        symbols = await self.pools[asset_type[0]].dequeue_batch(batch_limit)

        if not symbols:
            print(f"ERROR: {asset_type[0]} config.yaml asset_classes entry could not be parsed.")
            return []
        return symbols

    async def run_harvest_loop(self):
        logging.info(f"Starting harvest loop for {self.provider_name}...")
        counter = 0

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
                counter= (counter+1) % len(self.config.get("asset_classes", []))
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
                counter= (counter+1) % len(self.config.get("asset_classes", []))
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