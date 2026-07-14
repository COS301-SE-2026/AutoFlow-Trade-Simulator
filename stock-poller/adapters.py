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
            return []

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
        selected_symbol = symbols[0]
        params = {
            self.config["key_param_name"]: self.api_key,
            "symbol": selected_symbol,
            "interval": "1min"
        }

        url = f"{self.base_url}/time_series"
        response = await client.get(url, params=params, timeout=10.0)
        return response

    async def _validate_payload(self, payload) -> tuple[bool, str]:
        if not isinstance(payload, dict):
            return False, "Payload root must be an object"

        if "meta" not in payload or not isinstance(payload["meta"], dict):
            return False, "Missing or invalid 'meta' (must be an object)"

        if "values" not in payload or not isinstance(payload["values"], list):
            return False, "Missing or invalid 'values' (must be a list)"

        if not payload["values"]:
            return False, "'values' must be a non-empty list"

        if "status" not in payload or not isinstance(payload["status"], str):
            return False, "Missing or invalid 'status' (must be a string)"

        meta = payload["meta"]
        required_meta_fields = {
            "symbol": str,
            "currency": str,
            "exchange": str
        }
        for field, expected_type in required_meta_fields.items():
            if field not in meta:
                return False, f"Missing required field '{field}' in meta"
            if not isinstance(meta[field], expected_type):
                return False, f"'{field}' in meta must be a {expected_type.__name__}"

        for idx, item in enumerate(payload["values"]):
            if not isinstance(item, dict):
                return False, f"Item {idx} in 'values' must be an object"

            required_keys = ["datetime", "open", "high", "low", "close", "volume"]
            for key in required_keys:
                if key not in item:
                    return False, f"Item {idx} missing required key '{key}'"
                if not isinstance(item[key], str):
                    return False, f"Item {idx} '{key}' must be a string"

        return True, "Valid"

    async def transform_payload(self, asset_class: str, symbols: list[str], payload) -> list[dict]:
        (is_valid, msg) = await self._validate_payload(payload)
        if not is_valid:
            logging.error(f"Failed to validate TwelveData response for {asset_class}: {msg}")
            return []

        rows = []
        results = payload["values"]
        symbol=payload["meta"]["symbol"]
        currency = payload["meta"]["currency"]
        exchange = payload["meta"]["exchange"]
        for res in results:
            rows.append({
                "symbol": symbol,
                "table": "dailyohlcv",
                "timestamp": datetime.fromisoformat(res["datetime"]).replace(tzinfo=None),
                "open": res["open"],
                "high": res["high"],
                "low": res["low"],
                "close": res["close"],
                "volume": res["volume"],
                "exchange": exchange,
                "currency": currency,
            })
        return rows


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

    async def _validate_payload(self, payload) -> tuple[bool, str]:
        if not isinstance(payload, dict):
            return False, "Payload root must be an object"

        if "data" not in payload or not isinstance(payload["data"], dict):
            return False, "Missing or invalid 'data' (must be an object)"
        if "status" not in payload or not isinstance(payload["status"], dict):
            return False, "Missing or invalid 'status' (must be an object)"

        data = payload["data"]
        if not data:
            return False, "'data' must not be empty"

        for ticker_key, crypto in data.items():
            if not isinstance(crypto, dict):
                return False, f"Crypto entry for '{ticker_key}' must be an object"

            if "symbol" not in crypto or not isinstance(crypto["symbol"], str):
                return False, f"Missing or invalid 'symbol' in '{ticker_key}'"

            quote = crypto.get("quote")
            if not isinstance(quote, dict):
                return False, f"Missing or invalid 'quote' in '{ticker_key}'"
            usd = quote.get("USD")
            if not isinstance(usd, dict):
                return False, f"Missing or invalid 'quote.USD' in '{ticker_key}'"

            price = usd.get("price")
            if price is not None and not isinstance(price, (int, float)):
                return False, f"'price' in '{ticker_key}' must be a number or null"

            volume = usd.get("volume_24h")
            if not isinstance(volume, (int, float)):
                return False, f"Missing or invalid 'volume_24h' in '{ticker_key}' (must be a number)"

            last_updated = usd.get("last_updated")
            if not isinstance(last_updated, str):
                return False, f"Missing or invalid 'last_updated' in '{ticker_key}' (must be a string)"

        return True, "Valid"

    async def transform_payload(self, asset_class: str, symbols: list[str], payload) -> list[dict]:
        (is_valid, msg) = await self._validate_payload(payload)
        if not is_valid:
            logging.error(f"Failed to validate CoinMarketCap response for {asset_class}: {msg}")
            return []

        rows = []
        data = payload["data"]
        for ticker_key, crypto in data.items():
            usd = crypto["quote"]["USD"]
            price = usd["price"]
            if price is None:
                continue
            rows.append({
                "symbol": crypto["symbol"],
                "table": "realtimeticks",
                "timestamp": datetime.fromisoformat(usd["last_updated"]).replace(tzinfo=None),
                "price": price,
                "volume": usd["volume_24h"],
                "currency": "USD",
            })
        return rows

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

    async def _validate_payload(self, payload) -> tuple[bool, str]:
        if not isinstance(payload, list):
            return False, "Payload root must be an array"
        if len(payload) == 0:
            return False, "Payload array must not be empty"

        for idx, item in enumerate(payload):
            if not isinstance(item, dict):
                return False, f"Item {idx} must be an object"

            symbol = item.get("symbol")
            if not isinstance(symbol, str) or not symbol.strip():
                return False, f"Item {idx} missing or invalid 'symbol' (must be non-empty string)"

            price = item.get("current_price")
            if price is not None and not isinstance(price, (int, float)):
                return False, f"Item {idx} 'current_price' must be a number or null"

            volume = item.get("total_volume")
            if volume is not None and not isinstance(volume, (int, float)):
                return False, f"Item {idx} 'total_volume' must be a number or null"

            last_updated = item.get("last_updated")
            if not isinstance(last_updated, str) or not last_updated.strip():
                return False, f"Item {idx} missing or invalid 'last_updated' (must be non-empty string)"

        return True, "Valid"

    async def transform_payload(self, asset_class: str, symbols: list[str], payload) -> list[dict]:
        (is_valid, msg) = await self._validate_payload(payload)
        if not is_valid:
            logging.error(f"Failed to validate CoinGecko response for {asset_class}: {msg}")
            return []

        rows = []
        for coin in payload:
            symbol = coin.get("symbol")
            price = coin.get("current_price")
            volume = coin.get("total_volume")
            last_updated = coin.get("last_updated")

            if price is None:
                continue

            if not symbol or not last_updated:
                continue

            try:
                timestamp = datetime.fromisoformat(last_updated)
                timestamp = timestamp.replace(tzinfo=None)
            except ValueError:
                logging.warning(f"Invalid last_updated format: {last_updated} for {symbol}")
                continue

            rows.append({
                "symbol": symbol.upper(),
                "table": "realtimeticks",
                "timestamp": timestamp,
                "price": price,
                "volume": volume if volume is not None else 0,
                "currency": "USD",
            })

        return rows

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