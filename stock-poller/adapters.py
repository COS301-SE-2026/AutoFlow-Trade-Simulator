import os
import httpx
from base_adapter import BaseMarketDataAdapter

class MassiveAdapter(BaseMarketDataAdapter):
    def __init__(self, config: dict, pools: dict):
        super().__init__(provider_name="massive", config=config)
        self.api_key = os.getenv(config["api_key_env_var"], "MOCK_MASSIVE_KEY")
        self.base_params = {"apiKey": self.api_key, "adjusted": "true"}
        self.pools = pools

    async def fetch_and_store(self):
        if "stocks" not in self.config["asset_classes"]:
            return

        batch_limit = self.config["rest"]["batch_limits"].get("stocks", 1)
        symbols = await self.pools["stocks"].dequeue_batch(batch_limit)

        if not symbols:
            return

        ticker = symbols[0].upper()
        url = f"{self.base_url}/v2/aggs/ticker/{ticker}/prev"

        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(url, params=self.base_params, timeout=10.0)

                if response.status_code == 200:
                    payload = response.json()
                    if payload.get("resultsCount", 0) > 0:
                        self.save_to_lake(asset_class="stocks", payload=payload)
                elif response.status_code == 429:
                    print(f"WARN: Rate limit exceeded while fetching {ticker}. Pacing window check required.")
                else:
                    response.raise_for_status()
            except Exception as e:
                print(f"ERROR: Failed to harvest daily stock OHLCV data for {ticker}: {str(e)}")


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
                self.config["key_param_name"]: self.api_key,
                "symbol": selected_symbol
            }

            url = f"{self.base_url}/etfs"
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
                    self.config["key_param_name"]: self.api_key,
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
        self.headers = {config["key_param_name"]: os.getenv(config["api_key_env_var"], "MOCK_CMC_KEY")}
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
                self.config["key_param_name"]: self.api_key,
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
            asset_class = "currencies"

            batch_limit = self.config["rest"]["batch_limits"]
            raw_symbols = await self.pools[asset_class].dequeue_batch(batch_limit)
            if not raw_symbols:
                return

            symbols = []
            for sym in raw_symbols:
                cleaned = sym.replace("/", "")
                if ".FOREX" not in cleaned.upper():
                    cleaned = f"{cleaned}.FOREX"
                symbols.append(cleaned)

            # EODHD batch syntax: /real-time/{main_ticker}?s={ticker2},{ticker3}
            main_ticker = symbols[0]
            params = {
                self.config["key_param_name"]: self.api_key,
                "fmt": "json"
            }

            if len(symbols) > 1:
                params["s"] = ",".join(symbols[1:])

            url = f"{self.base_url}/real-time/{main_ticker}"

            try:
                response = await client.get(url, params=params, timeout=12.0)
                if response.status_code == 200:
                    self.save_to_lake(asset_class=asset_class, payload=response.json())
                else:
                    response.raise_for_status()
            except Exception as e:
                print(f"ERROR: EodHistorical batch forex fetch failed for {symbols}: {str(e)}")

class VectradeAdapter(BaseMarketDataAdapter):
    def __init__(self, config: dict, pools: dict):
        super().__init__(provider_name="vectrade", config=config)
        self.headers = {config["key_param_name"]: os.getenv(config["api_key_env_var"], "MOCK_VECTRADE_KEY")}
        self.pools = pools

    async def fetch_and_store(self):
        if "stocks" not in self.config["asset_classes"]:
            return

        batch_limit = self.config["rest"]["batch_limits"]["stocks"]

        symbols = await self.pools["vectrade_stocks"].dequeue_batch(batch_limit)
        if not symbols:
            return

        params = {"symbols": ",".join(symbols)}
        url = f"{self.base_url}/v1/vq/quotes/batch"

        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(url, headers=self.headers, params=params, timeout=15.0)
                if response.status_code == 200:
                    self.save_to_lake(asset_class="stocks", payload=response.json())
                else:
                    response.raise_for_status()
            except Exception as e:
                print(f"ERROR: Vectrade batch stocks quotes fetch failed: {str(e)}")

class FCSAdapter(BaseMarketDataAdapter):
    """
    Handles bulk commodity tracking via query parameter authentication
    and mandatory static endpoint filtering keys.
    """
    def __init__(self, config: dict, pools: dict):
        super().__init__(provider_name="fcs", config=config)
        self.api_key = os.getenv(config["api_key_env_var"], "MOCK_FCS_KEY")
        self.pools = pools

    async def fetch_and_store(self):
        batch_limit = self.config["rest"]["batch_limits"]
        symbols = await self.pools["commodities"].dequeue_batch(batch_limit)
        if not symbols:
            return

        async with httpx.AsyncClient() as client:
            params = {
                self.config["key_param_name"]: self.api_key,
                "symbol": ",".join(symbols),
                "type": self.config["rest"]["query_filters"]["type"] # Injects 'commodity' string dynamically
            }

            # Formats cleanly to: https://api-v4.fcsapi.com/forex/latest
            url = f"{self.base_url}/latest"

            response = await client.get(url, params=params, timeout=12.0)
            if response.status_code == 200:
                self.save_to_lake(asset_class="commodities", payload=response.json())
            else:
                response.raise_for_status()