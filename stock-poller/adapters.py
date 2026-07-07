import os
import httpx
from base_adapter import BaseMarketDataAdapter

class MassiveAdapter(BaseMarketDataAdapter):
    def __init__(self, config: dict, pools: dict, market_event):
        super().__init__(provider_name="massive", config=config, market_event=market_event, pools=pools)
        self.api_key = os.getenv(config["api_key_env_var"], "MOCK_MASSIVE_KEY")
        self.base_params = {"apiKey": self.api_key, "adjusted": "true"}

    async def make_request(self, client, symbols: list[str], asset:str):
        ticker = symbols[0].upper()
        url = f"{self.base_url}/v2/aggs/ticker/{ticker}/prev"
        response = await client.get(url, params=self.base_params, timeout=10.0)
        return response


class TwelveDataAdapter(BaseMarketDataAdapter):
    def __init__(self, config: dict, pools: dict, market_event):
        super().__init__(provider_name="twelve_data", config=config, market_event=market_event, pools=pools)
        self.api_key = os.getenv(config["api_key_env_var"], "MOCK_12DATA_KEY")

    async def make_request(self, client, symbols: list[str], asset:str):
        selected_symbol = symbols[0]
        params = {
            self.config["key_param_name"]: self.api_key,
            "symbol": selected_symbol
        }

        url = f"{self.base_url}/etfs"
        response = await client.get(url, params=params, timeout=10.0)
        return response

class FinnhubAdapter(BaseMarketDataAdapter):
    """
    Handles standard Forex and Crypto quotes via URL query parameter authentication.
    Note: Finnhub does not support native batching for quotes on basic tiers.
    """
    def __init__(self, config: dict, pools: dict, market_event):
        super().__init__(provider_name="finnhub", config=config, market_event=market_event, pools=pools)
        self.api_key = os.getenv(config["api_key_env_var"], "MOCK_FINNHUB_KEY")

    async def make_request(self, client, symbols: list[str], asset:str):
        symbols = await self.pools[asset].dequeue_batch(1)
        if not symbols:
            return

        params = {
            self.config["key_param_name"]: self.api_key,
            "symbol": symbols[0]
        }

        # Finnhub dynamic endpoint structure layout
        endpoint = "forex/rates" if asset == "currencies" else "crypto/candle"
        url = f"{self.base_url}/{endpoint}"

        response = await client.get(url, params=params, timeout=10.0)
        return response

class CoinMarketCapAdapter(BaseMarketDataAdapter):
    """
    Handles heavy parallel batch requests for Crypto quotes using header auth.
    """
    def __init__(self, config: dict, pools: dict, market_event):
        super().__init__(provider_name="coinmarketcap", config=config, market_event=market_event, pools=pools)
        self.headers = {config["key_param_name"]: os.getenv(config["api_key_env_var"], "MOCK_CMC_KEY")}

    async def make_request(self, client, symbols: list[str], asset:str):
        params = {"symbol": ",".join(symbols), "convert": "USD"}
        url = f"{self.base_url}/cryptocurrency/quotes/latest"

        response = await client.get(url, headers=self.headers, params=params, timeout=10.0)
        return response

class CoinGeckoAdapter(BaseMarketDataAdapter):
    """
    Handles Crypto asset indexing tracking via demo query strings.
    Supports high-volume comma separated IDs.
    """
    def __init__(self, config: dict, pools: dict, market_event):
        super().__init__(provider_name="coingecko", config=config, market_event=market_event, pools=pools)
        self.api_key = os.getenv(config["api_key_env_var"], "MOCK_GECKO_KEY")
        self.headers = {config["key_param_name"]: os.getenv(config["api_key_env_var"], "MOCK_CG_KEY")}

    async def make_request(self, client, symbols: list[str], asset:str):
        params = {
            "vs_currency": "usd",
            "symbols": ",".join(symbols).lower()
        }
        url = f"{self.base_url}/coins/markets"

        response = await client.get(url, headers=self.headers, params=params, timeout=10.0)
        return response

class EodHistoricalAdapter(BaseMarketDataAdapter):
    def __init__(self, config: dict, pools: dict, market_event):
        super().__init__(provider_name="eod_historical", config=config, market_event=market_event, pools=pools)
        self.api_key = os.getenv(config["api_key_env_var"], "MOCK_EOD_KEY")

    async def make_request(self, client, symbols: list[str], asset:str):
        formatted_symbols = []
        for sym in symbols:
            cleaned = sym.replace("/", "")
            if ".FOREX" not in cleaned.upper():
                cleaned = f"{cleaned}.FOREX"
            formatted_symbols.append(cleaned)

        # EODHD batch syntax: /real-time/{main_ticker}?s={ticker2},{ticker3}
        main_ticker = formatted_symbols[0]
        params = {
            self.config["key_param_name"]: self.api_key,
            "fmt": "json"
        }

        if len(formatted_symbols) > 1:
            params["s"] = ",".join(formatted_symbols[1:])

        url = f"{self.base_url}/real-time/{main_ticker}"

        response = await client.get(url, params=params, timeout=12.0)
        return response

class VectradeAdapter(BaseMarketDataAdapter):
    def __init__(self, config: dict, pools: dict, market_event):
        super().__init__(provider_name="vectrade", config=config, market_event=market_event, pools=pools)
        self.headers = {config["key_param_name"]: os.getenv(config["api_key_env_var"], "MOCK_VECTRADE_KEY")}

    async def make_request(self, client, symbols: list[str], asset:str):
        params = {"symbols": ",".join(symbols)}
        url = f"{self.base_url}/v1/vq/quotes/batch"
        response = await client.get(url, headers=self.headers, params=params, timeout=15.0)
        return response

class FCSAdapter(BaseMarketDataAdapter):
    """
    Handles bulk commodity tracking via query parameter authentication
    and mandatory static endpoint filtering keys.
    """
    def __init__(self, config: dict, pools: dict, market_event):
        super().__init__(provider_name="fcs", config=config, market_event=market_event, pools=pools)
        self.api_key = os.getenv(config["api_key_env_var"], "MOCK_FCS_KEY")

    async def make_request(self, client, symbols: list[str], asset:str):
        print(symbols)
        params = {
            self.config["key_param_name"]: self.api_key,
            "symbol": ",".join(symbols),
            "type": self.config["rest"]["query_filters"]["type"]
        }

        url = f"{self.base_url}/latest"

        response = await client.get(url, params=params, timeout=12.0)
        return response