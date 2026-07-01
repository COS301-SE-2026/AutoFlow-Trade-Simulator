import yaml
import asyncio
from adapters import MassiveAdapter, TwelveDataAdapter

async def main():
    # Load updated market-calibrated configuration values
    with open("config.yaml", "r") as f:
        config_root = yaml.safe_load(f)

    # Instantiate concrete workers mapping directly to custom classes
    workers = [
        MassiveAdapter(config=config_root["massive"]),
        TwelveDataAdapter(config=config_root["twelve_data"])
        # Add remaining child classes here
    ]

    # Spin up all data pipelines to operate simultaneously
    await asyncio.gather(*(worker.run_harvest_loop() for worker in workers))

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nHarvest pipeline gracefully suspended.")