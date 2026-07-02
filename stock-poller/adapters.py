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

class FinnhubAdapter(BaseMarketDataAdapter):
    """
    Handles standard Forex and Crypto quotes via URL query parameter authentication.
    Note: Finnhub does not support native batching for quotes on basic tiers.
    """
    def __init__(self, config: dict, pools: dict):
        super().__init__(provider_name="finnhub", config=config)
        self.api_key = os.getenv(config["api_key_env_var"], "MOCK_FINNHUB_KEY")
        self.pools = pools

    async def fetch_and_store(self):
        async with httpx.AsyncClient() as client:
            for asset_class in ["currencies", "crypto"]:
                # Process 1 ticker at a time per loop cycle due to batch limits
                symbols = await self.pools[asset_class].dequeue_batch(1)
                if not symbols:
                    continue

                target_symbol = symbols[0]
                params = {
                    self.config["auth_param_name"]: self.api_key,
                    "symbol": target_symbol
                }

                # Finnhub dynamic endpoint structure layout
                endpoint = "forex/rates" if asset_class == "currencies" else "crypto/candle"
                url = f"{self.base_url}/{endpoint}"

                response = await client.get(url, params=params, timeout=10.0)
                if response.status_code == 200:
                    self.save_to_lake(asset_class=asset_class, payload=response.json())
                else:
                    response.raise_for_status()

class CoinMarketCapAdapter(BaseMarketDataAdapter):
    """
    Handles heavy parallel batch requests for Crypto quotes using header auth.
    """
    def __init__(self, config: dict, pools: dict):
        super().__init__(provider_name="coinmarketcap", config=config)
        self.headers = {config["auth_param_name"]: os.getenv(config["api_key_env_var"], "MOCK_CMC_KEY")}
        self.pools = pools

    async def fetch_and_store(self):
        # Consume a highly packed batch of crypto IDs/Symbols sequentially
        symbols = await self.pools["crypto"].dequeue_batch(100)
        if not symbols:
            return

        async with httpx.AsyncClient() as client:
            params = {"symbol": ",".join(symbols), "convert": "USD"}
            url = f"{self.base_url}/cryptocurrency/quotes/latest"

            response = await client.get(url, headers=self.headers, params=params, timeout=10.0)
            if response.status_code == 200:
                self.save_to_lake(asset_class="crypto", payload=response.json())
            else:
                response.raise_for_status()

class CoinGeckoAdapter(BaseMarketDataAdapter):
    """
    Handles Crypto asset indexing tracking via demo query strings.
    Supports high-volume comma separated IDs.
    """
    def __init__(self, config: dict, pools: dict):
        super().__init__(provider_name="coingecko", config=config)
        self.api_key = os.getenv(config["api_key_env_var"], "MOCK_GECKO_KEY")
        self.pools = pools

    async def fetch_and_store(self):
        # Pull 250 elements simultaneously matching their coins_markets capability
        batch_limit = self.config["rest"]["batch_limits"]["coins_markets"]
        symbols = await self.pools["crypto"].dequeue_batch(batch_limit)
        if not symbols:
            return

        async with httpx.AsyncClient() as client:
            params = {
                self.config["auth_param_name"]: self.api_key,
                "vs_currency": "usd",
                "ids": ",".join(symbols).lower()
            }
            url = f"{self.base_url}/coins/markets"

            response = await client.get(url, params=params, timeout=10.0)
            if response.status_code == 200:
                self.save_to_lake(asset_class="crypto", payload=response.json())
            else:
                response.raise_for_status()

class EodHistoricalAdapter(BaseMarketDataAdapter):
    """
    Handles slow, high-latency historical/delayed stock and currency tracks.
    """
    def __init__(self, config: dict, pools: dict):
        super().__init__(provider_name="eod_historical", config=config)
        self.api_key = os.getenv(config["api_key_env_var"], "MOCK_EOD_KEY")
        self.pools = pools

    async def fetch_and_store(self):
        async with httpx.AsyncClient() as client:
            for asset_class in ["stocks", "currencies"]:
                symbols = await self.pools[asset_class].dequeue_batch(1)
                if not symbols:
                    continue

                target_symbol = symbols[0]
                params = {self.config["auth_param_name"]: self.api_key, "fmt": "json"}

                # Format: /real-time/AAPL.US
                url = f"{self.base_url}/real-time/{target_symbol}"

                response = await client.get(url, params=params, timeout=12.0)
                if response.status_code == 200:
                    self.save_to_lake(asset_class=asset_class, payload=response.json())
                else:
                    response.raise_for_status()

class VectradeAdapter(BaseMarketDataAdapter):
    """
    Handles bulk options tracking using Header-based token security.
    Pulls batch slices of option contract tickers sequentially.
    """
    def __init__(self, config: dict, pools: dict):
        super().__init__(provider_name="vectrade", config=config)
        self.headers = {config["auth_param_name"]: os.getenv(config["api_key_env_var"], "MOCK_VECTRADE_KEY")}
        self.pools = pools

    async def fetch_and_store(self):
        # Extract the specialized allocation limit for options strings
        batch_limit = self.config["rest"]["batch_limits"]["options"]

        # Pull the next sequential chunk of option tickers from the ring buffer
        symbols = await self.pools["options"].dequeue_batch(batch_limit)
        if not symbols:
            return

        async with httpx.AsyncClient() as client:
            # Vectrade accepts an array or JSON body mapping for targeted updates
            payload_body = {
                "contracts": symbols,
                "snapshot": True
            }
            url = f"{self.base_url}/v1/options/quotes"

            response = await client.post(url, headers=self.headers, json=payload_body, timeout=15.0)
            if response.status_code == 200:
                self.save_to_lake(asset_class="options", payload=response.json())
            else:
                response.raise_for_status()
#ITick API key has expired, nevertheless, I will leave this adapter here in case the situation changes
"""class ITickAdapter(BaseMarketDataAdapter):
    def __init__(self, config: dict, pools: dict):
        super().__init__(provider_name="itick", config=config)
        self.api_key = os.getenv(config["api_key_env_var"], "MOCK_ITICK_KEY")
        self.headers = {config["auth_param_name"]: self.api_key}
        self.pools = pools

    async def fetch_and_store(self):
        async with httpx.AsyncClient() as client:
            # Loop through the asset classes configured for Itick (futures, indices)
            for asset_class in self.config["asset_classes"].keys():
                batch_limit = self.config["rest"]["batch_limits"]

                # Fetch the next chunk of tokens from the specific asset ring buffer
                symbols = await self.pools[asset_class].dequeue_batch(batch_limit)
                if not symbols:
                    continue

                # ITick accepts a comma-separated query parameter for batch ticker queries
                symbol_string = ",".join(symbols)
                url = f"{self.base_url}/{asset_class}/ticks?region=US&codes={symbol_string}"

                response = await client.get(url, headers=self.headers, timeout=10.0)
                if response.status_code == 200:
                    self.save_to_lake(asset_class=asset_class, payload=response.json())
                else:
                    response.raise_for_status()"""