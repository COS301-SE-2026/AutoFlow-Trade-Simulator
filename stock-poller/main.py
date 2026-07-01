import yaml
import asyncio
from adapters import MassiveAdapter, TwelveDataAdapter, FinnhubAdapter, CoinMarketCapAdapter, CoinGeckoAdapter, EodHistoricalAdapter
from base_adapter import TickerRingBuffer

async def main():
    with open("config.yaml", "r") as f:
        config_root = yaml.safe_load(f)

    # 1. Initialize the shared ring buffers for each asset class
    shared_pools = {}
    for asset_class, symbols in config_root.get("ticker_pools", {}).items():
        shared_pools[asset_class] = TickerRingBuffer(symbols)

    # 2. Instantiate workers, passing the shared memory pools into them
    workers = [
        MassiveAdapter(config=config_root["massive"], pools=shared_pools),
        TwelveDataAdapter(config=config_root["twelve_data"], pools=shared_pools),
        FinnhubAdapter(config=config_root["finnhub"], pools=shared_pools),
        CoinMarketCapAdapter(config=config_root["coinmarketcap"], pools=shared_pools),
        CoinGeckoAdapter(config=config_root["coingecko"], pools=shared_pools),
        EodHistoricalAdapter(config=config_root["eod_historical"], pools=shared_pools)
    ]

    # Spin up all data pipelines to operate simultaneously
    await asyncio.gather(*(worker.run_harvest_loop() for worker in workers))

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nHarvest pipeline gracefully suspended.")