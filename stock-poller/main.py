import logging
import yaml
import asyncio
from adapters import MassiveAdapter, TwelveDataAdapter, FCSAdapter, CoinMarketCapAdapter, CoinGeckoAdapter, EodHistoricalAdapter, VectradeAdapter
from base_adapter import TickerRingBuffer
import zoneinfo
from datetime import datetime

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

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
    for asset_class, symbols in config.get("ticker_pools", {}).items():
        shared_pools[asset_class] = TickerRingBuffer(symbols)

    market_open_event = asyncio.Event()

    # 2. Instantiate workers, passing the shared memory pools into them
    workers = [
        MassiveAdapter(config=config["massive"], pools=shared_pools, market_event=market_open_event),
        TwelveDataAdapter(config=config["twelve_data"], pools=shared_pools, market_event=market_open_event),
        #FinnhubAdapter(config=config["finnhub"], pools=shared_pools, market_event=market_open_event),
        CoinMarketCapAdapter(config=config["coinmarketcap"], pools=shared_pools, market_event=market_open_event),
        CoinGeckoAdapter(config=config["coingecko"], pools=shared_pools, market_event=market_open_event),
        EodHistoricalAdapter(config=config["eod_historical"], pools=shared_pools, market_event=market_open_event),
        VectradeAdapter(config=config["vectrade"], pools=shared_pools, market_event=market_open_event),
        FCSAdapter(config=config["fcs"], pools=shared_pools, market_event=market_open_event),
    ]

    await asyncio.gather(
        market_clock_broadcaster(market_open_event),
        *(worker.run_harvest_loop() for worker in workers)
    )

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logging.info("\nHarvest pipeline gracefully suspended.")