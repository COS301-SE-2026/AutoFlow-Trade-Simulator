import os
import httpx
from base_adapter import BaseMarketDataAdapter

class MassiveAdapter(BaseMarketDataAdapter):
    def __init__(self, config: dict):
        super().__init__(provider_name="massive", config=config)
        self.api_key = os.getenv(config["api_key_env_var"], "MOCK_MASSIVE_KEY")
        self.headers = {config["auth_param_name"]: self.api_key}

    async def fetch_and_store(self):
        async with httpx.AsyncClient() as client:
            for asset_class in self.config["asset_classes"].keys():
                batch_limit = self.config["rest"]["batch_limits"][asset_class]

                url = f"{self.base_url}/v1/quotes/{asset_class}?limit={batch_limit}"
                response = await client.get(url, headers=self.headers, timeout=10.0)

                if response.status_code == 200:
                    self.save_to_lake(asset_class=asset_class, payload=response.json())
                else:
                    response.raise_for_status()


class TwelveDataAdapter(BaseMarketDataAdapter):
    def __init__(self, config: dict):
        super().__init__(provider_name="twelve_data", config=config)
        self.api_key = os.getenv(config["api_key_env_var"], "MOCK_12DATA_KEY")

    async def fetch_and_store(self):
        async with httpx.AsyncClient() as client:
            params = {
                self.config["auth_param_name"]: self.api_key,
                "interval": "1min",
                "symbol": "SPX"
            }

            url = f"{self.base_url}/price"
            response = await client.get(url, params=params, timeout=10.0)

            if response.status_code == 200:
                self.save_to_lake(asset_class="indices", payload=response.json())
            else:
                response.raise_for_status()