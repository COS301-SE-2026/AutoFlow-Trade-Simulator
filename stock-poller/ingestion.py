import asyncio
import logging
import asyncpg

from db import upsert_realtime_ticks, upsert_daily_ohlcv

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")


def build_lanes(ingestion_config: dict) -> tuple[asyncio.Queue, asyncio.Queue]:
    fast_queue = asyncio.Queue(maxsize=ingestion_config["fast_lane"]["queue_maxsize"])
    slow_queue = asyncio.Queue(maxsize=ingestion_config["slow_lane"]["queue_maxsize"])
    return fast_queue, slow_queue


class IngestWorker:
    """
    We chose a one writer policy to minimize collisions on the database.
    The fast lane always right of way.
    Each lane empties/flushes when one of either its temporal or space triggers are met.
    The queue item is a tuple of (table_name:str, row_information: dict)
    """

    def __init__(self, pool: asyncpg.Pool, fast_queue: asyncio.Queue, slow_queue: asyncio.Queue, ingestion_config: dict):
        self.pool = pool
        self.fast_queue = fast_queue
        self.slow_queue = slow_queue
        self.fast_cfg = ingestion_config["fast_lane"]
        self.slow_cfg = ingestion_config["slow_lane"]

    async def _drain_lane(self, queue: asyncio.Queue, volume_trigger: int, temporal_trigger_seconds: float) -> dict:
        buffer = {"realtimeticks": [], "dailyohlcv": []}

        # wait for the first item
        try:
            table, row = await asyncio.wait_for(queue.get(), timeout=temporal_trigger_seconds)
        except asyncio.TimeoutError:
            return buffer

        #then start checking for more once it arrives
        buffer[table].append(row)
        first_item_time = asyncio.get_event_loop().time()

        while len(buffer["realtimeticks"]) + len(buffer["dailyohlcv"]) < volume_trigger:
            elapsed = asyncio.get_event_loop().time() - first_item_time
            remaining = temporal_trigger_seconds - elapsed
            if remaining <= 0:
                break
            try:
                table, row = await asyncio.wait_for(queue.get(), timeout=remaining)
            except asyncio.TimeoutError:
                break
            buffer[table].append(row)

        return buffer

    async def _flush(self, buffer: dict):
        await upsert_realtime_ticks(self.pool, buffer["realtimeticks"])
        await upsert_daily_ohlcv(self.pool, buffer["dailyohlcv"])
        count = len(buffer["realtimeticks"]) + len(buffer["dailyohlcv"])
        if count:
            logging.info(f"Flushed {count} rows to DB.")

    async def run(self):
        logging.info("Ingest worker starting weighted interleave loop...")
        while True:
            fast_buffer = await self._drain_lane(
                self.fast_queue,
                self.fast_cfg["volume_trigger"],
                self.fast_cfg["temporal_trigger_seconds"],
            )
            if fast_buffer["realtimeticks"] or fast_buffer["dailyohlcv"]:
                await self._flush(fast_buffer)
                continue  # fast lane gets right-of-way again immediately

            # Fast lane fully drained start a small batch of slow lane, to give the fast lane opportunity to go first
            slow_buffer = await self._drain_lane(
                self.slow_queue,
                self.slow_cfg["volume_trigger"],
                self.slow_cfg["temporal_trigger_seconds"],
            )
            if slow_buffer["realtimeticks"] or slow_buffer["dailyohlcv"]:
                await self._flush(slow_buffer)
            else:
                # blocks the thread instead of infinite looping and wasting resources
                await asyncio.sleep(0.25)