import logging
import os
import httpx
from typing import Optional
from base_adapter import BaseMarketDataAdapter
import yaml
from datetime import datetime, timezone

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

payload_message = "Payload root must be an object"

#refactored generic validation methods to reduce "cognitive complexity" PHP style.
def _type_ok(value, expected_type, allow_none: bool = False) -> bool:
    if value is None:
        return allow_none
    return isinstance(value, expected_type)


def _validate_fields(record: dict, specs) -> Optional[str]:
    for field, expected_type, allow_none in specs:
        value = record.get(field)
        if not _type_ok(value, expected_type, allow_none):
            return f"Missing or invalid '{field}'"
    return None


def _validate_list_items(items, specs, label: str) -> Optional[str]:
    if not isinstance(items, list):
        return f"'{label}' must be a list"
    for idx, item in enumerate(items):
        if not isinstance(item, dict):
            return f"{label} {idx} must be an object"
        error = _validate_fields(item, specs)
        if error:
            return f"{label} {idx}: {error}"
    return None


class MassiveAdapter(BaseMarketDataAdapter):
    _RESULT_SPECS = [
        ("o", float, False),
        ("T", str, False),
        ("h", float, False),
        ("l", float, False),
        ("c", float, False),
        ("v", float, False),
        ("t", int, False),
    ]

    def __init__(self, config: dict, pools: dict, market_event, db_ctx: Optional[dict] = None):
        super().__init__(provider_name="massive", config=config, market_event=market_event, pools=pools, db_ctx=db_ctx)
        self.api_key = os.getenv(config["api_key_env_var"], "MOCK_MASSIVE_KEY")
        self.base_params = {"apiKey": self.api_key, "adjusted": "true"}

    async def make_request(self, client, symbols: list[str], asset:str):
        ticker = symbols[0]
        url = f"{self.base_url}/v2/aggs/ticker/{ticker}/prev"
        response = await client.get(url, params=self.base_params, timeout=10.0)
        return response

    def _validate_payload(self, payload) -> tuple[bool, str]:
        if not isinstance(payload, dict):
            return False, payload_message
        if not _type_ok(payload.get("ticker"), str):
            return False, "Missing or invalid 'ticker'"

        results = payload.get("results")
        if not isinstance(results, list) or not results:
            return False, "Missing or invalid 'results' (must be a non-empty list)"

        error = _validate_list_items(results, self._RESULT_SPECS, "result")
        if error:
            return False, error

        return True, "Valid"

    async def transform_payload(self, asset_class: str, symbols: list[str], payload) -> list[dict]:
        (is_valid, msg) = self._validate_payload(payload)
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
    _META_SPECS = [
        ("symbol", str, False),
        ("currency", str, False),
        ("exchange", str, False),
    ]
    _VALUE_SPECS = [
        ("datetime", str, False),
        ("open", str, False),
        ("high", str, False),
        ("low", str, False),
        ("close", str, False),
        ("volume", str, False),
    ]

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

    def _validate_payload(self, payload) -> tuple[bool, str]:
        if not isinstance(payload, dict):
            return False, payload_message

        meta = payload.get("meta")
        if not isinstance(meta, dict):
            return False, "Missing or invalid 'meta' (must be an object)"

        values = payload.get("values")
        if not isinstance(values, list) or not values:
            return False, "Missing or invalid 'values' (must be a non-empty list)"

        if not _type_ok(payload.get("status"), str):
            return False, "Missing or invalid 'status' (must be a string)"

        error = _validate_fields(meta, self._META_SPECS)
        if error:
            return False, f"meta: {error}"

        error = _validate_list_items(values, self._VALUE_SPECS, "Item")
        if error:
            return False, error

        return True, "Valid"

    async def transform_payload(self, asset_class: str, symbols: list[str], payload) -> list[dict]:
        (is_valid, msg) = self._validate_payload(payload)
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
    def __init__(self, config: dict, pools: dict, market_event, db_ctx: Optional[dict] = None):
        super().__init__(provider_name="finnhub", config=config, market_event=market_event, pools=pools, db_ctx=db_ctx)
        self.api_key = os.getenv(config["api_key_env_var"], "MOCK_FINNHUB_KEY")

    async def make_request(self, client, symbols: list[str], asset:str):
        params = {
            self.config["key_param_name"]: self.api_key,
            "symbol": symbols[0]
        }

        endpoint = "forex/rates" if asset == "currencies" else "crypto/candle"
        url = f"{self.base_url}/{endpoint}"

        response = await client.get(url, params=params, timeout=10.0)
        return response

    async def transform_payload(self, asset_class: str, symbols: list[str], payload) -> list[dict]:
        raise NotImplementedError("FinnhubAdapter.transform_payload not implemented due to no valuable pricing data available")

class CoinMarketCapAdapter(BaseMarketDataAdapter):
    def __init__(self, config: dict, pools: dict, market_event, db_ctx: Optional[dict] = None):
        super().__init__(provider_name="coinmarketcap", config=config, market_event=market_event, pools=pools, db_ctx=db_ctx)
        self.headers = {config["key_param_name"]: os.getenv(config["api_key_env_var"], "MOCK_CMC_KEY")}

    async def make_request(self, client, symbols: list[str], asset:str):
        params = {"symbol": ",".join(symbols), "convert": "USD"}
        url = f"{self.base_url}/cryptocurrency/quotes/latest"

        response = await client.get(url, headers=self.headers, params=params, timeout=10.0)
        return response

    @staticmethod
    def _validate_crypto_quote(ticker_key: str, crypto) -> Optional[str]:
        if not isinstance(crypto, dict):
            return f"Crypto entry for '{ticker_key}' must be an object"
        if not _type_ok(crypto.get("symbol"), str):
            return f"Missing or invalid 'symbol' in '{ticker_key}'"

        quote = crypto.get("quote")
        if not isinstance(quote, dict):
            return f"Missing or invalid 'quote' in '{ticker_key}'"
        usd = quote.get("USD")
        if not isinstance(usd, dict):
            return f"Missing or invalid 'quote.USD' in '{ticker_key}'"

        if not _type_ok(usd.get("price"), (int, float), allow_none=True):
            return f"'price' in '{ticker_key}' must be a number or null"
        if not _type_ok(usd.get("volume_24h"), (int, float)):
            return f"Missing or invalid 'volume_24h' in '{ticker_key}' (must be a number)"
        if not _type_ok(usd.get("last_updated"), str):
            return f"Missing or invalid 'last_updated' in '{ticker_key}' (must be a string)"

        return None

    def _validate_payload(self, payload) -> tuple[bool, str]:
        if not isinstance(payload, dict):
            return False, payload_message

        data = payload.get("data")
        if not isinstance(data, dict) or not data:
            return False, "Missing or invalid 'data' (must be a non-empty object)"
        if not isinstance(payload.get("status"), dict):
            return False, "Missing or invalid 'status' (must be an object)"

        for ticker_key, crypto in data.items():
            error = self._validate_crypto_quote(ticker_key, crypto)
            if error:
                return False, error

        return True, "Valid"

    async def transform_payload(self, asset_class: str, symbols: list[str], payload) -> list[dict]:
        (is_valid, msg) = self._validate_payload(payload)
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

    @staticmethod
    def _validate_coin(idx: int, item) -> Optional[str]:
        if not isinstance(item, dict):
            return f"Item {idx} must be an object"

        symbol = item.get("symbol")
        if not isinstance(symbol, str) or not symbol.strip():
            return f"Item {idx} missing or invalid 'symbol' (must be non-empty string)"

        if not _type_ok(item.get("current_price"), (int, float), allow_none=True):
            return f"Item {idx} 'current_price' must be a number or null"
        if not _type_ok(item.get("total_volume"), (int, float), allow_none=True):
            return f"Item {idx} 'total_volume' must be a number or null"

        last_updated = item.get("last_updated")
        if not isinstance(last_updated, str) or not last_updated.strip():
            return f"Item {idx} missing or invalid 'last_updated' (must be non-empty string)"

        return None

    def _validate_payload(self, payload) -> tuple[bool, str]:
        if not isinstance(payload, list) or not payload:
            return False, "Payload root must be a non-empty array"

        for idx, item in enumerate(payload):
            error = self._validate_coin(idx, item)
            if error:
                return False, error

        return True, "Valid"

    async def transform_payload(self, asset_class: str, symbols: list[str], payload) -> list[dict]:
        (is_valid, msg) = self._validate_payload(payload)
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
    _OPTIONAL_NUMERIC_FIELDS = ["open", "high", "low", "close", "volume"]

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

    @classmethod
    def _validate_eod_item(cls, idx: int, item) -> Optional[str]:
        if not isinstance(item, dict):
            return f"Item {idx} must be an object"

        for field in cls._OPTIONAL_NUMERIC_FIELDS:
            if not _type_ok(item.get(field), (int, float), allow_none=True):
                return f"Item {idx} '{field}' must be a number or null"

        date = item.get("date")
        if not isinstance(date, str) or not date.strip():
            return f"Item {idx} missing or invalid 'date' (must be non-empty string)"

        return None

    def _validate_payload(self, payload) -> tuple[bool, str]:
        if not isinstance(payload, list) or not payload:
            return False, "Payload root must be a non-empty array"

        for idx, item in enumerate(payload):
            error = self._validate_eod_item(idx, item)
            if error:
                return False, error

        return True, "Valid"

    async def transform_payload(self, asset_class: str, symbols: list[str], payload) -> list[dict]:
        if len(symbols)<=0:
            logging.error("No symbol passed in to EOD transform_payload")
            return []
        (is_valid, msg) = self._validate_payload(payload)
        if not is_valid:
            logging.error(f"Failed to validate EOD response for {asset_class}: {msg}")
            return []

        symbol = symbols[0]
        rows = []
        for forex in payload:
            open_price = forex.get("open")
            high = forex.get("high")
            low = forex.get("low")
            close = forex.get("close")
            volume = forex.get("volume")
            date = forex.get("date")

            if open_price is None or high is None or low is None or close is None or volume is None:
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

class VectradeAdapter(BaseMarketDataAdapter):
    _STOCK_ENTRY_SPECS = [
        ("ticker", str, False),
        ("open", (float, int), False),
        ("high", (float, int), False),
        ("low", (float, int), False),
        ("prevClose", (float, int), False),
        ("volume", (float, int), False),
        ("timestamp", str, False),
    ]

    _OPTION_LEG_SPECS = [
        ("contractSymbol", str, False),
        ("lastTradeDate", str, False),
        ("strike", (int, float), False),
        ("lastPrice", (int, float), False),
        ("bid", (int, float), False),
        ("volume", (int, float), True),
        ("openInterest", (int, float), True),
        ("impliedVolatility", (int, float), True),
        ("inTheMoney", bool, False),
    ]

    _OPTIONS_TOP_LEVEL_SPECS = [
        ("ticker", str, False),
        ("expiration", str, False),
    ]

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

    def _validate_stock_payload(self, payload) -> tuple[bool, str]:
        if not isinstance(payload, dict):
            return False, payload_message

        data = payload.get("data")
        if not isinstance(data, dict) or not data:
            return False, "Missing or invalid 'data' (must be a non-empty object)"

        for key, entry in data.items():
            error = _validate_fields(entry, self._STOCK_ENTRY_SPECS)
            if error:
                return False, error

        return True, "Valid"

    @classmethod
    def _validate_option_leg(cls, leg_name: str, idx: int, opt) -> Optional[str]:
        if not isinstance(opt, dict):
            return f"{leg_name} option {idx} must be an object"
        error = _validate_fields(opt, cls._OPTION_LEG_SPECS)
        if error:
            return f"{leg_name} {idx} {error}"
        return None

    def _validate_options_payload(self, payload) -> tuple[bool, str]:
        if not isinstance(payload, dict):
            return False, "Root must be an object"

        error = _validate_fields(payload, self._OPTIONS_TOP_LEVEL_SPECS)
        if error:
            return False, error

        calls = payload.get("calls")
        puts = payload.get("puts")
        if not isinstance(calls, list):
            return False, "calls must be a list"
        if not isinstance(puts, list):
            return False, "puts must be a list"

        for leg_name, legs in (("Call", calls), ("Put", puts)):
            for idx, opt in enumerate(legs):
                error = self._validate_option_leg(leg_name, idx, opt)
                if error:
                    return False, error

        return True, "Valid"

    async def transform_payload(self, asset_class: str, symbols: list[str], payload) -> list[dict]:
        if asset_class=="vectrade_stocks":
            (is_valid, msg) = self._validate_stock_payload(payload)
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
            (is_valid, msg) = self._validate_options_payload(payload)
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
    _PREVIOUS_SPECS = [
        ("o", (int, float), False),
        ("h", (int, float), False),
        ("l", (int, float), False),
        ("c", (int, float), False),
        ("v", (int, float), True),
    ]

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

    @classmethod
    def _validate_previous(cls, idx: int, prev: Optional[dict]) -> Optional[str]:
        if not isinstance(prev, dict):
            return f"Item {idx} missing/invalid 'previous'"
        error = _validate_fields(prev, cls._PREVIOUS_SPECS)
        if error:
            return f"Item {idx} previous.{error}"
        if not isinstance(prev.get("t"), int) or not prev.get("t"):
            return f"Item {idx} 'previous.t' must be a non-zero integer"
        return None

    @staticmethod
    def _validate_active(idx: int, active: Optional[dict]) -> Optional[str]:
        if not isinstance(active, dict):
            return f"Item {idx} missing/invalid 'active'"
        if not _type_ok(active.get("c"), (int, float)):
            return f"Item {idx} missing/invalid 'active.c'"
        if not isinstance(active.get("t"), int) or not active.get("t"):
            return f"Item {idx} missing/invalid 't' in 'active'"
        return None

    @classmethod
    def _validate_response_item(cls, idx: int, item) -> Optional[str]:
        if not isinstance(item, dict):
            return f"Item {idx} must be an object"
        if not _type_ok(item.get("ticker"), str):
            return f"Item {idx} missing/invalid 'ticker'"

        error = cls._validate_active(idx, item.get("active"))
        if error:
            return error

        return cls._validate_previous(idx, item.get("previous"))

    def _validate_payload(self, payload) -> tuple[bool, str]:
        if not isinstance(payload, dict):
            return False, "Root must be an object"

        response = payload.get("response")
        if not isinstance(response, list) or not response:
            return False, "Missing or invalid 'response' (must be a non-empty list)"

        for idx, item in enumerate(response):
            error = self._validate_response_item(idx, item)
            if error:
                return False, error

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
        is_valid, msg = self._validate_payload(payload)
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