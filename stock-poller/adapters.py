import logging
import os
from base_adapter import BaseMarketDataAdapter
import yaml

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

class MassiveAdapter(BaseMarketDataAdapter):
    def __init__(self, config: dict, pools: dict, market_event):
        super().__init__(provider_name="massive", config=config, market_event=market_event, pools=pools)
        self.api_key = os.getenv(config["api_key_env_var"], "MOCK_MASSIVE_KEY")
        self.base_params = {"apiKey": self.api_key, "adjusted": "true"}

    async def make_request(self, client, symbols: list[str], asset:str):
        ticker = symbols[0]
        url = f"{self.base_url}/v2/aggs/ticker/{ticker}/prev"
        response = await client.get(url, params=self.base_params, timeout=10.0)
        return response


class TwelveDataAdapter(BaseMarketDataAdapter):
    def __init__(self, config: dict, pools: dict, market_event):
        super().__init__(provider_name="twelve_data", config=config, market_event=market_event, pools=pools)
        self.api_key = os.getenv(config["api_key_env_var"], "MOCK_12DATA_KEY")

    async def make_request(self, client, symbols: list[str], asset:str):
        if asset=="twelve_stocks":
            selected_symbol = symbols[0]
            params = {
                self.config["key_param_name"]: self.api_key,
                "symbol": selected_symbol,
                "interval": "1min"
            }

            url = f"{self.base_url}/time_series"
            response = await client.get(url, params=params, timeout=10.0)
            return response
        elif asset=="etfs":
            selected_symbol = symbols[0]
            params = {
                self.config["key_param_name"]: self.api_key,
                "symbol": selected_symbol
            }

            url = f"{self.base_url}/etfs"
            response = await client.get(url, params=params, timeout=10.0)
            return response
        else:
            logging.error("Invalid asset type passed in to TwelveAdapter: make_request")
            return {}

class FinnhubAdapter(BaseMarketDataAdapter):
    """
    Handles standard Forex and Crypto quotes via URL query parameter authentication.
    Note: Finnhub does not support native batching for quotes on basic tiers.
    """
    def __init__(self, config: dict, pools: dict, market_event):
        super().__init__(provider_name="finnhub", config=config, market_event=market_event, pools=pools)
        self.api_key = os.getenv(config["api_key_env_var"], "MOCK_FINNHUB_KEY")

    async def make_request(self, client, symbols: list[str], asset:str):
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

        with open("config.yaml", "r") as f:
            yaml_config = yaml.safe_load(f)
        self.symbol_to_id = yaml_config.get("cg-mapping", {})

    async def make_request(self, client, symbols: list[str], asset:str):
        cg_ids = [self.symbol_to_id[sym] for sym in symbols if sym in self.symbol_to_id]

        if not cg_ids:
            return {}

        params = {
            "vs_currency": "usd",
            "ids": ",".join(cg_ids).lower()
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

        # https://eodhd.com/api/eod/EURUSD.FOREX?api_token=DEMO&fmt=json
        main_ticker = formatted_symbols[0]
        params = {
            self.config["key_param_name"]: self.api_key,
            "fmt": "json"
        }

        if len(formatted_symbols) > 1:
            params["s"] = ",".join(formatted_symbols[1:])

        url = f"{self.base_url}/eod/{main_ticker}"

        response = await client.get(url, params=params, timeout=12.0)
        return response

class VectradeAdapter(BaseMarketDataAdapter):
    def __init__(self, config: dict, pools: dict, market_event):
        super().__init__(provider_name="vectrade", config=config, market_event=market_event, pools=pools)
        self.headers = {config["key_param_name"]: os.getenv(config["api_key_env_var"], "MOCK_VECTRADE_KEY")}

    async def make_request(self, client, symbols: list[str], asset:str):
        if asset=="vectrade_stocks":
            params = {"symbols": ",".join(symbols)}
            url = f"{self.base_url}/v1/vq/quotes/batch"
            response = await client.get(url, headers=self.headers, params=params, timeout=15.0)
            return response
        elif asset=="options":
            url = f"{self.base_url}/v1/vq/options/{symbols[0]}/chain"
            response = await client.get(url, headers=self.headers, timeout=15.0)
            return response
        else:
            logging.error("Invalid asset type passed in to VectradeAdapter: make_request")
            return {}

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

        response = await client.get(url, params=params, timeout=60.0)
        return response