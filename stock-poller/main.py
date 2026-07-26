import yaml
import asyncio
import logging
from adapters import MassiveAdapter, TwelveDataAdapter, FCSAdapter, CoinMarketCapAdapter, CoinGeckoAdapter, EodHistoricalAdapter, VectradeAdapter
from base_adapter import TickerRingBuffer
import zoneinfo
from datetime import datetime

import db
from ingestion import build_lanes, IngestWorker

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)

def load_yaml_sync():
    with open("config.yaml", "r") as f:
        return yaml.safe_load(f)

async def market_clock_broadcaster(market_open_event: asyncio.Event):
    nyse_tz = zoneinfo.ZoneInfo("America/New_York")

    while True:
        now = datetime.now(nyse_tz)
        is_weekday = now.weekday() < 5
        # market opens 09:30:00 and closes at 16:00:00
        is_market_hours = is_weekday and (9, 30, 0) <= (now.hour, now.minute, now.second) < (16, 0, 0)

        if is_market_hours:
            if not market_open_event.is_set():
                logging.info("[%s] Market Open Broadcast Sent", now.strftime('%X'))
                market_open_event.set()
        else:
            if market_open_event.is_set():
                logging.info("[%s] Market Close Broadcast Sent", now.strftime('%X'))
                market_open_event.clear()

        # conserve resources by only checking once per second.
        await asyncio.sleep(1)

async def main():
    config = await asyncio.to_thread(load_yaml_sync)

    # 1. Initialize the shared ring buffers for each asset class
    shared_pools = {}
    asset_class_maps = {}
    for asset_class, symbols in config.get("ticker_pools", {}).items():
        if isinstance(symbols, dict):
            flat_symbols = []
            symbol_to_subclass = {}
            for sub_class, sub_symbols in symbols.items():
                flat_symbols.extend(sub_symbols)
                for sym in sub_symbols:
                    symbol_to_subclass[sym] = sub_class
            shared_pools[asset_class] = TickerRingBuffer(flat_symbols)
            asset_class_maps[asset_class] = symbol_to_subclass
        else:
            shared_pools[asset_class] = TickerRingBuffer(symbols)

    market_open_event = asyncio.Event()

    # 2. DB_MODE wiring: pool + lazy asset cache + fast/slow lane queues + shared writer.
    #    In flat-file mode none of this spins up — db_ctx stays None, adapters
    #    fall back to save_to_lake untouched.
    db_ctx = None
    background_tasks = [market_clock_broadcaster(market_open_event)]

    if db.DB_MODE:
        pool = await db.init_pool(config["database"])
        asset_cache = db.AssetCache(pool)
        fast_queue, slow_queue = build_lanes(config["ingestion"])

        db_ctx = {
            "pool": pool,
            "asset_cache": asset_cache,
            "fast_queue": fast_queue,
            "slow_queue": slow_queue,
            "asset_class_maps": asset_class_maps,
        }

        ingest_worker = IngestWorker(pool, fast_queue, slow_queue, config["ingestion"])
        background_tasks.append(ingest_worker.run())
        logging.info("DB_MODE enabled — ingest worker + lanes online.")
    else:
        logging.info("DB_MODE disabled — writing to flat-file data lake.")

    # 3. Instantiate workers, passing the shared memory pools (and db_ctx) into them
    workers = [
        MassiveAdapter(config=config["massive"], pools=shared_pools, market_event=market_open_event, db_ctx=db_ctx),
        TwelveDataAdapter(config=config["twelve_data"], pools=shared_pools, market_event=market_open_event, db_ctx=db_ctx),
        #FinnhubAdapter(config=config["finnhub"], pools=shared_pools, market_event=market_open_event, db_ctx=db_ctx),
        CoinMarketCapAdapter(config=config["coinmarketcap"], pools=shared_pools, market_event=market_open_event, db_ctx=db_ctx),
        CoinGeckoAdapter(config=config["coingecko"], pools=shared_pools, market_event=market_open_event, db_ctx=db_ctx),
        EodHistoricalAdapter(config=config["eod_historical"], pools=shared_pools, market_event=market_open_event, db_ctx=db_ctx),
        VectradeAdapter(config=config["vectrade"], pools=shared_pools, market_event=market_open_event, db_ctx=db_ctx),
        FCSAdapter(config=config["fcs"], pools=shared_pools, market_event=market_open_event, db_ctx=db_ctx),
    ]

    await asyncio.gather(
        *background_tasks,
        *(worker.run_harvest_loop() for worker in workers)
    )

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logging.info("\nHarvest pipeline gracefully suspended.")