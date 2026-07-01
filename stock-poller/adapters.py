import os
import httpx
from base_adapter import BaseMarketDataAdapter

class MassiveAdapter(BaseMarketDataAdapter):
    def __init__(self, config: dict, pools: dict):
        super().__init__(provider_name="massive", config=config)
        self.api_key = os.getenv(config["api_key_env_var"], "MOCK_MASSIVE_KEY")
        self.headers = {config["auth_param_name"]: self.api_key}
        self.pools = pools

    async def fetch_and_store(self):
        async with httpx.AsyncClient() as client:
            # Loop through the asset classes configured for Massive (stocks, options)
            for asset_class in self.config["asset_classes"].keys():
                batch_limit = self.config["rest"]["batch_limits"][asset_class]

                # Fetch the next chunk of tokens from the specific asset ring buffer
                symbols = await self.pools[asset_class].dequeue_batch(batch_limit)
                if not symbols:
                    continue

                # Massive accepts a comma-separated query parameter for batch tokens
                symbol_string = ",".join(symbols)
                url = f"{self.base_url}/v1/quotes/{asset_class}?symbols={symbol_string}"

                response = await client.get(url, headers=self.headers, timeout=10.0)
                if response.status_code == 200:
                    self.save_to_lake(asset_class=asset_class, payload=response.json())
                else:
                    response.raise_for_status()


class TwelveDataAdapter(BaseMarketDataAdapter):
    def __init__(self, config: dict, pools: dict):
        super().__init__(provider_name="twelve_data", config=config)
        self.api_key = os.getenv(config["api_key_env_var"], "MOCK_12DATA_KEY")
        self.pools = pools

    async def fetch_and_store(self):
        # Twelve Data basic tier handles single ticker calls for this endpoint layout
        batch_limit = self.config["rest"]["batch_limits"]

        # Pop the next isolated index symbol from the conveyor belt
        target_symbols = await self.pools["indices"].dequeue_batch(batch_limit)
        if not target_symbols:
            return

        selected_symbol = target_symbols[0]

        async with httpx.AsyncClient() as client:
            params = {
                self.config["auth_param_name"]: self.api_key,
                "interval": "1min",
                "symbol": selected_symbol
            }

            url = f"{self.base_url}/price"
            response = await client.get(url, params=params, timeout=10.0)

            if response.status_code == 200:
                self.save_to_lake(asset_class="indices", payload=response.json())
            else:
                response.raise_for_status()

