import yaml
import asyncio
from adapters import MassiveAdapter, TwelveDataAdapter, FinnhubAdapter, CoinMarketCapAdapter, CoinGeckoAdapter, EodHistoricalAdapter, VectradeAdapter
from base_adapter import TickerRingBuffer

def load_yaml_sync():
    with open("config.yaml", "r") as f:
        return yaml.safe_load(f)

async def main():
    config = await asyncio.to_thread(load_yaml_sync)

    # 1. Initialize the shared ring buffers for each asset class
    shared_pools = {}
    for asset_class, symbols in config.get("ticker_pools", {}).items():
        shared_pools[asset_class] = TickerRingBuffer(symbols)

    # 2. Instantiate workers, passing the shared memory pools into them
    workers = [
        MassiveAdapter(config=config["massive"], pools=shared_pools),
        TwelveDataAdapter(config=config["twelve_data"], pools=shared_pools),
        #FinnhubAdapter(config=config["finnhub"], pools=shared_pools),
        CoinMarketCapAdapter(config=config["coinmarketcap"], pools=shared_pools),
        CoinGeckoAdapter(config=config["coingecko"], pools=shared_pools),
        EodHistoricalAdapter(config=config["eod_historical"], pools=shared_pools),
        VectradeAdapter(config=config["vectrade"], pools=shared_pools),
    ]

    # Spin up all data pipelines to operate simultaneously
    await asyncio.gather(*(worker.run_harvest_loop() for worker in workers))

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nHarvest pipeline gracefully suspended.")