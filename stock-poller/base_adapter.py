import os
import json
import gzip
import asyncio
from datetime import datetime
from abc import ABC, abstractmethod
import logging
import random
from typing import List, Union

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

class BaseMarketDataAdapter(ABC):
    def __init__(self, provider_name: str, config: dict):
        self.provider_name = provider_name
        self.config = config

        # Pull timing constraints from the calibrated YAML
        self.seconds_per_request = config.get("seconds_per_request", 1.0)
        self.base_url = config.get("base_url")

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
    async def fetch_and_store(self):
        pass

    async def run_harvest_loop(self):
        logging.info(f"Starting harvest loop for {self.provider_name}...")
        mock_mode = os.getenv("MOCK_MODE", "false").lower() == "true"

        while True:
            start_time = asyncio.get_event_loop().time()
            try:
                if mock_mode:
                    mock_payload = {
                        "symbol": "MOCK",
                        "last_price": round(random.uniform(10, 500), 4),
                        "total_volume": random.randint(1000, 50000)
                    }
                    await asyncio.sleep(0.1)
                    self.save_to_lake(asset_class="mock_asset", payload=mock_payload)
                else:
                    await self.fetch_and_store()
            except Exception as e:
                logging.error(f"Error: {e}")

            elapsed = asyncio.get_event_loop().time() - start_time
            sleep_time = max(0, self.seconds_per_request - elapsed)
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