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

    async def _validate_payload(self, payload) -> tuple[bool, str]:
        if not isinstance(payload, list):
            return False, "Payload root must be an array"
        if len(payload) == 0:
            return False, "Payload array must not be empty"

        for idx, item in enumerate(payload):
            if not isinstance(item, dict):
                return False, f"Item {idx} must be an object"

            open_price = item.get("open")
            if open_price is not None and not isinstance(open_price, (int, float)):
                return False, f"Item {idx} 'open' must be a number or null"

            volume = item.get("volume")
            if volume is not None and not isinstance(volume, (int, float)):
                return False, f"Item {idx} 'volume' must be a number or null"

            date = item.get("date")
            if not isinstance(date, str) or not date.strip():
                return False, f"Item {idx} missing or invalid 'date' (must be non-empty string)"

            high = item.get("high")
            if high is not None and not isinstance(high, (int, float)):
                return False, f"Item {idx} 'high' must be a number or null"

            low = item.get("low")
            if low is not None and not isinstance(low, (int, float)):
                return False, f"Item {idx} 'low' must be a number or null"

            close = item.get("close")
            if close is not None and not isinstance(close, (int, float)):
                return False, f"Item {idx} 'close' must be a number or null"

        return True, "Valid"

    async def transform_payload(self, asset_class: str, symbols: list[str], payload) -> list[dict]:
        if len(symbols)<=0:
            logging.error(f"No symbol passed in to EOD transform_payload")
            return []
        (is_valid, msg) = await self._validate_payload(payload)
        if not is_valid:
            logging.error(f"Failed to validate EOD response for {asset_class}: {msg}")
            return []

        symbol = symbols[0]
        rows = []
        for forex in payload:
            open = forex.get("open")
            high = forex.get("high")
            low = forex.get("low")
            close = forex.get("close")
            volume = forex.get("volume")
            date = forex.get("date")

            if open is None or high is None or low is None or close is None or volume is None:
                continue

            if not date:
                continue

            try:
                timestamp = datetime.fromisoformat(date)
                timestamp = timestamp.replace(tzinfo=None)
            except ValueError:
                logging.warning(f"Invalid date format: {date} for {symbol}")
                continue

            rows.append({
                "symbol": symbol,
                "table": "dailyohlcv",
                "timestamp": timestamp,
                "open": open,
                "high": high,
                "low": low,
                "close": close,
                "volume": volume,
                "currency": "USD",
                "exchange": "US"
            })

        return rows

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

    async def _validate_stock_payload(self, payload) -> tuple[bool, str]:
        if not isinstance(payload, dict):
            return False, "Payload root must be an object"

        if "data" not in payload or not isinstance(payload["data"], dict):
            return False, "Missing or invalid 'data' (must be an object)"

        data = payload["data"]
        if len(data.items())==0:
            return False, "'data' must have at least one entry"

        for key, entry in data.items():
            if "ticker" not in entry or not isinstance(entry["ticker"], str):
                return False, "Missing or invalid 'ticker' (must be a string)"

            if "open" not in entry or not isinstance(entry["open"], (float, int)):
                return False, "Missing or invalid 'open' (must be a number)"

            if "high" not in entry or not isinstance(entry["high"], (float, int)):
                return False, "Missing or invalid 'high' (must be a number)"

            if "low" not in entry or not isinstance(entry["low"], (float, int)):
                return False, "Missing or invalid 'low' (must be a number)"

            if "prevClose" not in entry or not isinstance(entry["prevClose"], (float, int)):
                return False, "Missing or invalid 'prevClose' (must be a number)"

            if "volume" not in entry or not isinstance(entry["volume"], (float, int)):
                return False, "Missing or invalid 'volume' (must be a number)"

            if "timestamp" not in entry or not isinstance(entry["timestamp"], str):
                return False, "Missing or invalid 'timestamp' (must be a string)"

        return True, "Valid"

    async def _validate_options_payload(self, payload) -> tuple[bool, str]:
        if not isinstance(payload, dict):
            return False, "Root must be an object"

        required_top = {"ticker", "expiration", "calls", "puts"}
        for field in required_top:
            if field not in payload:
                return False, f"Missing top-level field '{field}'"
        if not isinstance(payload["ticker"], str):
            return False, "ticker must be a string"
        if not isinstance(payload["expiration"], str):
            return False, "expiration must be a string (date)"
        if not isinstance(payload["calls"], list):
            return False, "calls must be a list"
        if not isinstance(payload["puts"], list):
            return False, "puts must be a list"

        for idx, opt in enumerate(payload["calls"]):
            if not isinstance(opt, dict):
                return False, f"Call option {idx} must be an object"
            if "contractSymbol" not in opt or not isinstance(opt["contractSymbol"], str):
                return False, f"Call {idx} missing/invalid contractSymbol"
            if "lastTradeDate" not in opt or not isinstance(opt["lastTradeDate"], str):
                return False, f"Call {idx} missing/invalid lastTradeDate"
            if "strike" not in opt or not isinstance(opt["strike"], (int, float)):
                return False, f"Call {idx} missing/invalid strike"
            if "lastPrice" not in opt or not isinstance(opt["lastPrice"], (int, float)):
                return False, f"Call {idx} missing/invalid lastPrice"
            if "bid" not in opt or not isinstance(opt["bid"], (int, float)):
                return False, f"Call {idx} missing/invalid bid"
            if "volume" in opt and opt["volume"] is not None and not isinstance(opt["volume"], (int, float)):
                return False, f"Call {idx} volume must be a number or null"
            if "openInterest" in opt and opt["openInterest"] is not None and not isinstance(opt["openInterest"], (int, float)):
                return False, f"Call {idx} openInterest must be a number or null"
            if "impliedVolatility" in opt and opt["impliedVolatility"] is not None and not isinstance(opt["impliedVolatility"], (int, float)):
                return False, f"Call {idx} impliedVolatility must be a number or null"
            if "inTheMoney" not in opt or not isinstance(opt["inTheMoney"], bool):
                return False, f"Call {idx} inTheMoney must be a boolean"

        for idx, opt in enumerate(payload["puts"]):
            if not isinstance(opt, dict):
                return False, f"Put option {idx} must be an object"
            if "contractSymbol" not in opt or not isinstance(opt["contractSymbol"], str):
                return False, f"Put {idx} missing/invalid contractSymbol"
            if "lastTradeDate" not in opt or not isinstance(opt["lastTradeDate"], str):
                return False, f"Put {idx} missing/invalid lastTradeDate"
            if "strike" not in opt or not isinstance(opt["strike"], (int, float)):
                return False, f"Put {idx} missing/invalid strike"
            if "lastPrice" not in opt or not isinstance(opt["lastPrice"], (int, float)):
                return False, f"Put {idx} missing/invalid lastPrice"
            if "bid" not in opt or not isinstance(opt["bid"], (int, float)):
                return False, f"Put {idx} missing/invalid bid"
            if "volume" in opt and opt["volume"] is not None and not isinstance(opt["volume"], (int, float)):
                return False, f"Put {idx} volume must be a number or null"
            if "openInterest" in opt and opt["openInterest"] is not None and not isinstance(opt["openInterest"], (int, float)):
                return False, f"Put {idx} openInterest must be a number or null"
            if "impliedVolatility" in opt and opt["impliedVolatility"] is not None and not isinstance(opt["impliedVolatility"], (int, float)):
                return False, f"Put {idx} impliedVolatility must be a number or null"
            if "inTheMoney" not in opt or not isinstance(opt["inTheMoney"], bool):
                return False, f"Put {idx} inTheMoney must be a boolean"

        return True, "Valid"

    async def transform_payload(self, asset_class: str, symbols: list[str], payload) -> list[dict]:
        if asset_class=="vectrade_stocks":
            (is_valid, msg) = await self._validate_stock_payload(payload)
            if not is_valid:
                logging.error(f"Failed to validate EOD response for {asset_class}: {msg}")
                return []
            rows = []
            for key, entry in payload["data"].items():
                symbol = entry.get("ticker")
                open_price = entry.get("open")
                high = entry.get("high")
                low = entry.get("low")
                close = entry.get("prevClose")
                volume = entry.get("volume")
                date = entry.get("timestamp")

                if open is None or high is None or low is None or close is None or volume is None:
                    continue
                if not date:
                    continue

                try:
                    timestamp = datetime.fromisoformat(date)
                    timestamp = timestamp.replace(tzinfo=None)
                except ValueError:
                    logging.warning(f"Invalid date format: {date} for {symbol}")
                    continue

                rows.append({
                    "symbol": symbol,
                    "table": "dailyohlcv",
                    "timestamp": timestamp,
                    "open": open_price,
                    "high": high,
                    "low": low,
                    "close": close,
                    "volume": volume,
                    "currency": "USD",
                    "exchange": "US"
                })

            return rows
        elif asset_class=="options":
            (is_valid, msg) = await self._validate_options_payload(payload)
            if not is_valid:
                logging.error(f"Failed to validate options response: {msg}")
                return []

            ticker = payload["ticker"]

            expr_date_str = payload["expiration"]
            try:
                expr_date = datetime.strptime(expr_date_str, "%Y-%m-%d")
            except ValueError:
                logging.error(f"Invalid expiration date format: {expr_date_str}")
                return []

            rows = []
            all_options = [("CALL", opt) for opt in payload["calls"]] + [("PUT", opt) for opt in payload["puts"]]

            for opt_type, opt in all_options:
                ts = datetime.now().replace(tzinfo=None)

                row = {
                    "symbol": ticker,
                    "contract_symbol": opt["contractSymbol"],
                    "timestamp": ts,
                    "option_type": opt_type,
                    "strike_price": opt["strike"],
                    "expr_date": expr_date,
                    "bid": opt["bid"],
                    "ask": opt["ask"],
                    "last_price": opt["lastPrice"],
                    "volume": opt.get("volume") or 0,
                    "open_interest": opt.get("openInterest") or 0,
                    "imp_vol": opt.get("impliedVolatility") or 0.0,
                    "in_the_money": opt.get("inTheMoney", False),
                    "table": "options"
                }
                rows.append(row)

            return rows
        else:
            logging.error("Invalid asset type passed in to VectradeAdapter: transform_payload")
            return []

class FCSAdapter(BaseMarketDataAdapter):
    """
    Handles bulk commodity tracking via query parameter authentication
    and mandatory static endpoint filtering keys.
    """
    def __init__(self, config: dict, pools: dict, market_event, db_ctx: Optional[dict] = None):
        super().__init__(provider_name="fcs", config=config, market_event=market_event, pools=pools, db_ctx=db_ctx)
        self.api_key = os.getenv(config["api_key_env_var"], "MOCK_FCS_KEY")

    async def make_request(self, client, symbols: list[str], asset:str):
        params = {
            self.config["key_param_name"]: self.api_key,
            "symbol": ",".join(symbols),
            "type": self.config["rest"]["query_filters"]["type"]
        }

        url = f"{self.base_url}/latest"

        response = await client.get(url, params=params, timeout=60.0)
        return response

    async def _validate_payload(self, payload) -> tuple[bool, str]:
        if not isinstance(payload, dict):
            return False, "Root must be an object"
        if "response" not in payload or not isinstance(payload["response"], list):
            return False, "Missing or invalid 'response' (must be a list)"
        if not payload["response"]:
            return False, "'response' must be a non‑empty list"

        for idx, item in enumerate(payload["response"]):
            if not isinstance(item, dict):
                return False, f"Item {idx} must be an object"
            if "ticker" not in item or not isinstance(item["ticker"], str):
                return False, f"Item {idx} missing/invalid 'ticker'"
            if "active" not in item or not isinstance(item["active"], dict):
                return False, f"Item {idx} missing/invalid 'active'"
            if "previous" not in item or not isinstance(item["previous"], dict):
                return False, f"Item {idx} missing/invalid 'previous'"

            prev = item["previous"]
            required_prev = {"o", "h", "l", "c", "v", "t"}
            for field in required_prev:
                if field not in prev:
                    return False, f"Item {idx} missing '{field}' in 'previous'"
            if not isinstance(prev["o"], (int, float)):
                return False, f"Item {idx} 'previous.o' must be a number"
            if not isinstance(prev["h"], (int, float)):
                return False, f"Item {idx} 'previous.h' must be a number"
            if not isinstance(prev["l"], (int, float)):
                return False, f"Item {idx} 'previous.l' must be a number"
            if not isinstance(prev["c"], (int, float)):
                return False, f"Item {idx} 'previous.c' must be a number"
            if prev["v"] is not None and not isinstance(prev["v"], (int, float)):
                return False, f"Item {idx} 'previous.v' must be a number or null"
            if not isinstance(prev["t"], int) or not prev["t"]:
                return False, f"Item {idx} 'previous.t' must be a non‑empty string"

            active = item["active"]
            if "c" not in active or not isinstance(active["c"], (int, float)):
                return False, f"Item {idx} missing/invalid 'active.c'"
            if "t" not in active or not isinstance(active["t"], int) or not active["t"]:
                return False, f"Item {idx} missing/invalid 't' in 'active'"

        return True, "Valid"

    def aggregate_previous_data(self, response_list):
        groups = {}
        for item in response_list:
            ticker = item["ticker"]
            base_symbol = ticker.split(":", 1)[1] if ":" in ticker else ticker
            prev = item["previous"]

            if base_symbol not in groups:
                groups[base_symbol] = {
                    "symbol": base_symbol,
                    "open_sum": 0.0,
                    "high_sum": 0.0,
                    "low_sum": 0.0,
                    "close_sum": 0.0,
                    "volume_sum": 0.0,
                    "count": 0,
                    "timestamp": prev.get("t")
                }
            g = groups[base_symbol]
            g["open_sum"] += prev["o"]
            g["high_sum"] += prev["h"]
            g["low_sum"] += prev["l"]
            g["close_sum"] += prev["c"]
            g["volume_sum"] += prev["v"] if prev["v"] is not None else 0
            g["count"] += 1

        # Compute averages and produce final list
        result = []
        for base, g in groups.items():
            count = g["count"]
            result.append({
                "symbol": g["symbol"],
                "open": g["open_sum"] / count,
                "high": g["high_sum"] / count,
                "low": g["low_sum"] / count,
                "close": g["close_sum"] / count,
                "volume": g["volume_sum"],
                "timestamp": g["timestamp"]
            })
        return result

    async def transform_payload(self, asset_class: str, symbols: list[str], payload) -> list[dict]:
        is_valid, msg = await self._validate_payload(payload)
        if not is_valid:
            logging.error(f"FCS validation failed: {msg}")
            return []

        response_list = payload["response"]
        aggregated_daily = self.aggregate_previous_data(response_list)

        rows = []

        for daily in aggregated_daily:
            if symbols and daily["symbol"] not in symbols:
                continue

            ts = daily["timestamp"]
            dt = datetime.fromtimestamp(ts)

            rows.append({
                "symbol": daily["symbol"],
                "table": "dailyohlcv",
                "timestamp": dt.replace(tzinfo=None),
                "open": daily["open"],
                "high": daily["high"],
                "low": daily["low"],
                "close": daily["close"],
                "volume": daily["volume"],
                "currency": "USD",
            })

        seen_active = set()
        for item in response_list:
            ticker = item["ticker"]
            base_symbol = ticker.split(":", 1)[1] if ":" in ticker else ticker
            if symbols and base_symbol not in symbols:
                continue
            if base_symbol in seen_active:
                continue
            seen_active.add(base_symbol)

            active = item["active"]
            price = active.get("c")
            if price is None:
                continue

            update_str = item.get("updateTime")
            if update_str:
                dt = datetime.strptime(update_str, "%Y-%m-%d %H:%M:%S")
            else:
                dt = datetime.fromtimestamp(item.get("update", 0))

            rows.append({
                "symbol": base_symbol,
                "table": "realtimeticks",
                "timestamp": dt.replace(tzinfo=None),
                "price": price,
                "volume": active.get("v", 0) or 0,
                "currency": "USD",
            })

        return rows