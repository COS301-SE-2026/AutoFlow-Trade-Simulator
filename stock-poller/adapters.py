import logging
import os
import httpx
from typing import Optional
from base_adapter import BaseMarketDataAdapter
import yaml
from datetime import datetime, timezone

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

class MassiveAdapter(BaseMarketDataAdapter):
    def __init__(self, config: dict, pools: dict, market_event, db_ctx: Optional[dict] = None):
        super().__init__(provider_name="massive", config=config, market_event=market_event, pools=pools, db_ctx=db_ctx)
        self.api_key = os.getenv(config["api_key_env_var"], "MOCK_MASSIVE_KEY")
        self.base_params = {"apiKey": self.api_key, "adjusted": "true"}

    async def make_request(self, client, symbols: list[str], asset:str):
        ticker = symbols[0]
        url = f"{self.base_url}/v2/aggs/ticker/{ticker}/prev"
        response = await client.get(url, params=self.base_params, timeout=10.0)
        return response

    async def _validate_payload(self, payload) -> tuple[bool, str]:
        if not isinstance(payload, dict):
            return False, "Payload root must be an object"

        if "ticker" not in payload or not isinstance(payload["ticker"], str):
            return False, "Missing or invalid 'ticker'"

        if "results" in payload:
            results = payload["results"]

            if not isinstance(results, list) or not results:
                return False, "'results' must be a non-empty list"

            for result in results:
                if "o" not in result or not isinstance(result["o"], float):
                    return False, "Missing or invalid 'o'"

                if "T" not in result or not isinstance(result["T"], str):
                    return False, "Missing or invalid 'T'"

                if "h" not in result or not isinstance(result["h"], float):
                    return False, "Missing or invalid 'h'"

                if "l" not in result or not isinstance(result["l"], float):
                    return False, "Missing or invalid 'l'"

                if "c" not in result or not isinstance(result["c"], float):
                    return False, "Missing or invalid 'c'"

                if "v" not in result or not isinstance(result["v"], float):
                    return False, "Missing or invalid 'v'"

                if "t" not in result or not isinstance(result["t"], int):
                    return False, "Missing or invalid 't'"
        else:
            return False, "Missing or invalid 'results' (string)"
        return True, "Valid"

    async def transform_payload(self, asset_class: str, symbols: list[str], payload) -> list[dict]:
        (is_valid, msg) = await self._validate_payload(payload)
        if not is_valid:
            logging.error(f"Failed to validate Massive response: {msg}")

        rows = []
        results = payload["results"]
        for res in results:
            rows.append({
                "symbol": res["T"],
                "table": "dailyohlcv",
                "timestamp": datetime.fromtimestamp(res["t"]/1000, tz=timezone.utc).replace(tzinfo=None),
                "open": res["o"],
                "high": res["h"],
                "low": res["l"],
                "close": res["c"],
                "volume": res["v"],
                "exchange": "US",
                "currency": "USD",
            })
        return rows

class TwelveDataAdapter(BaseMarketDataAdapter):
    def __init__(self, config: dict, pools: dict, market_event, db_ctx: Optional[dict] = None):
        super().__init__(provider_name="twelve_data", config=config, market_event=market_event, pools=pools, db_ctx=db_ctx)
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

    async def transform_payload(self, asset_class: str, symbols: list[str], payload) -> list[dict]:
        # TODO: map TwelveData time_series/etfs payload -> rows
        raise NotImplementedError("TwelveDataAdapter.transform_payload not implemented yet")

class FinnhubAdapter(BaseMarketDataAdapter):
    """
    Handles standard Forex and Crypto quotes via URL query parameter authentication.
    Note: Finnhub does not support native batching for quotes on basic tiers.
    """
    def __init__(self, config: dict, pools: dict, market_event, db_ctx: Optional[dict] = None):
        super().__init__(provider_name="finnhub", config=config, market_event=market_event, pools=pools, db_ctx=db_ctx)
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

    async def transform_payload(self, asset_class: str, symbols: list[str], payload) -> list[dict]:
        # TODO: map Finnhub forex/rates or crypto/candle payload -> rows
        raise NotImplementedError("FinnhubAdapter.transform_payload not implemented yet")

class CoinMarketCapAdapter(BaseMarketDataAdapter):
    """
    Handles heavy parallel batch requests for Crypto quotes using header auth.
    """
    def __init__(self, config: dict, pools: dict, market_event, db_ctx: Optional[dict] = None):
        super().__init__(provider_name="coinmarketcap", config=config, market_event=market_event, pools=pools, db_ctx=db_ctx)
        self.headers = {config["key_param_name"]: os.getenv(config["api_key_env_var"], "MOCK_CMC_KEY")}

    async def make_request(self, client, symbols: list[str], asset:str):
        params = {"symbol": ",".join(symbols), "convert": "USD"}
        url = f"{self.base_url}/cryptocurrency/quotes/latest"

        response = await client.get(url, headers=self.headers, params=params, timeout=10.0)
        return response

    async def transform_payload(self, asset_class: str, symbols: list[str], payload) -> list[dict]:
        # TODO: map CMC quotes/latest payload -> rows
        raise NotImplementedError("CoinMarketCapAdapter.transform_payload not implemented yet")

class CoinGeckoAdapter(BaseMarketDataAdapter):
    """
    Handles Crypto asset indexing tracking via demo query strings.
    Supports high-volume comma separated IDs.
    """
    def __init__(self, config: dict, pools: dict, market_event, db_ctx: Optional[dict] = None):
        super().__init__(provider_name="coingecko", config=config, market_event=market_event, pools=pools, db_ctx=db_ctx)
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

    async def transform_payload(self, asset_class: str, symbols: list[str], payload) -> list[dict]:
        # TODO: map CoinGecko coins/markets payload -> rows
        raise NotImplementedError("CoinGeckoAdapter.transform_payload not implemented yet")

class EodHistoricalAdapter(BaseMarketDataAdapter):
    def __init__(self, config: dict, pools: dict, market_event, db_ctx: Optional[dict] = None):
        super().__init__(provider_name="eod_historical", config=config, market_event=market_event, pools=pools, db_ctx=db_ctx)
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

    async def transform_payload(self, asset_class: str, symbols: list[str], payload) -> list[dict]:
        # TODO: map EOD historical payload -> rows (likely dailyohlcv table)
        raise NotImplementedError("EodHistoricalAdapter.transform_payload not implemented yet")

class VectradeAdapter(BaseMarketDataAdapter):
    def __init__(self, config: dict, pools: dict, market_event, db_ctx: Optional[dict] = None):
        super().__init__(provider_name="vectrade", config=config, market_event=market_event, pools=pools, db_ctx=db_ctx)
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

    async def transform_payload(self, asset_class: str, symbols: list[str], payload) -> list[dict]:
        # TODO: map Vectrade quotes/batch (fast, realtimeticks) or options/chain (slow) -> rows
        raise NotImplementedError("VectradeAdapter.transform_payload not implemented yet")

class FCSAdapter(BaseMarketDataAdapter):
    """
    Handles bulk commodity tracking via query parameter authentication
    and mandatory static endpoint filtering keys.
    """
    def __init__(self, config: dict, pools: dict, market_event, db_ctx: Optional[dict] = None):
        super().__init__(provider_name="fcs", config=config, market_event=market_event, pools=pools, db_ctx=db_ctx)
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

    async def transform_payload(self, asset_class: str, symbols: list[str], payload) -> list[dict]:
        # TODO: map FCS commodities/latest payload -> rows
        raise NotImplementedError("FCSAdapter.transform_payload not implemented yet")