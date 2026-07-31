import pytest

from adapters import VectradeAdapter

pytestmark = pytest.mark.layer1


@pytest.fixture
def adapter(minimal_config, fake_pools, market_event_open):
    cfg = minimal_config({
        "vectrade_stocks": {"enabled": True, "lane": "fast"},
        "options": {"enabled": True, "lane": "slow"},
    })
    return VectradeAdapter(config=cfg, pools=fake_pools, market_event=market_event_open)


VALID_STOCK_PAYLOAD = {
    "data": {
        "AAPL": {
            "ticker": "AAPL",
            "open": 190.0,
            "high": 195.0,
            "low": 189.0,
            "prevClose": 193.0,
            "volume": 1_000_000,
            "timestamp": "2026-07-28",
        }
    }
}

VALID_OPTIONS_PAYLOAD = {
    "ticker": "AAPL",
    "expiration": "2026-08-21",
    "calls": [
        {
            "contractSymbol": "AAPL260821C00200000",
            "lastTradeDate": "2026-07-28",
            "strike": 200.0,
            "lastPrice": 5.5,
            "bid": 5.4,
            "ask": 5.6,
            "volume": 100,
            "openInterest": 500,
            "impliedVolatility": 0.25,
            "inTheMoney": False,
        }
    ],
    "puts": [],
}


class TestVectradeStockValidation:
    def test_valid_stock_payload_passes(self, adapter):
        ok, _ = adapter._validate_stock_payload(VALID_STOCK_PAYLOAD)
        assert ok is True

    def test_non_dict_root_rejected(self, adapter):
        ok, msg = adapter._validate_stock_payload([])
        assert ok is False

    def test_empty_data_rejected(self, adapter):
        ok, msg = adapter._validate_stock_payload({"data": {}})
        assert ok is False

    def test_entry_missing_field_rejected(self, adapter):
        bad_entry = {k: v for k, v in VALID_STOCK_PAYLOAD["data"]["AAPL"].items() if k != "volume"}
        ok, msg = adapter._validate_stock_payload({"data": {"AAPL": bad_entry}})
        assert ok is False
        assert "volume" in msg


class TestVectradeStockTransform:
    async def test_transform_stock_rows(self, adapter):
        rows = await adapter.transform_payload("vectrade_stocks", ["AAPL"], VALID_STOCK_PAYLOAD)
        assert len(rows) == 1
        row = rows[0]
        assert row["symbol"] == "AAPL"
        assert row["close"] == 193.0  # prevClose mapped to close
        assert row["table"] == "dailyohlcv"

    async def test_transform_returns_empty_on_invalid_payload(self, adapter):
        rows = await adapter.transform_payload("vectrade_stocks", ["AAPL"], {"data": {}})
        assert rows == []


class TestVectradeOptionsValidation:
    def test_valid_options_payload_passes(self, adapter):
        ok, _ = adapter._validate_options_payload(VALID_OPTIONS_PAYLOAD)
        assert ok is True

    def test_missing_top_level_field_rejected(self, adapter):
        bad = {k: v for k, v in VALID_OPTIONS_PAYLOAD.items() if k != "expiration"}
        ok, msg = adapter._validate_options_payload(bad)
        assert ok is False

    def test_calls_not_a_list_rejected(self, adapter):
        bad = {**VALID_OPTIONS_PAYLOAD, "calls": "not-a-list"}
        ok, msg = adapter._validate_options_payload(bad)
        assert ok is False
        assert "calls" in msg

    def test_leg_missing_field_rejected(self, adapter):
        bad_leg = {k: v for k, v in VALID_OPTIONS_PAYLOAD["calls"][0].items() if k != "bid"}
        bad = {**VALID_OPTIONS_PAYLOAD, "calls": [bad_leg]}
        ok, msg = adapter._validate_options_payload(bad)
        assert ok is False

    def test_optional_leg_fields_allow_none(self, adapter):
        leg = {**VALID_OPTIONS_PAYLOAD["calls"][0], "volume": None, "openInterest": None, "impliedVolatility": None}
        bad = {**VALID_OPTIONS_PAYLOAD, "calls": [leg]}
        ok, msg = adapter._validate_options_payload(bad)
        assert ok is True


class TestVectradeOptionsTransform:
    async def test_transform_produces_call_row(self, adapter):
        rows = await adapter.transform_payload("options", ["AAPL"], VALID_OPTIONS_PAYLOAD)
        assert len(rows) == 1
        row = rows[0]
        assert row["symbol"] == "AAPL"
        assert row["option_type"] == "CALL"
        assert row["strike_price"] == 200.0
        assert row["table"] == "options"
        assert row["expr_date"].isoformat().startswith("2026-08-21")

    async def test_transform_handles_calls_and_puts(self, adapter):
        payload = {**VALID_OPTIONS_PAYLOAD, "puts": [{**VALID_OPTIONS_PAYLOAD["calls"][0], "contractSymbol": "AAPL260821P00200000"}]}
        rows = await adapter.transform_payload("options", ["AAPL"], payload)
        types = {r["option_type"] for r in rows}
        assert types == {"CALL", "PUT"}

    async def test_transform_returns_empty_on_bad_expiration(self, adapter):
        bad = {**VALID_OPTIONS_PAYLOAD, "expiration": "not-a-date"}
        rows = await adapter.transform_payload("options", ["AAPL"], bad)
        assert rows == []

    async def test_transform_defaults_missing_optional_fields(self, adapter):
        leg = {**VALID_OPTIONS_PAYLOAD["calls"][0], "volume": None, "openInterest": None, "impliedVolatility": None}
        payload = {**VALID_OPTIONS_PAYLOAD, "calls": [leg]}
        rows = await adapter.transform_payload("options", ["AAPL"], payload)
        assert rows[0]["volume"] == 0
        assert rows[0]["open_interest"] == 0
        assert rows[0]["imp_vol"] == 0.0

    async def test_invalid_asset_class_returns_empty(self, adapter):
        rows = await adapter.transform_payload("bogus", ["AAPL"], VALID_OPTIONS_PAYLOAD)
        assert rows == []


class TestVectradeMakeRequest:
    async def test_stock_request_url(self, adapter):
        class FakeClient:
            async def get(self, url, headers, params, timeout):
                return {"url": url, "params": params}

        result = await adapter.make_request(FakeClient(), ["AAPL", "MSFT"], "vectrade_stocks")
        assert result["url"] == f"{adapter.base_url}/v1/vq/quotes/batch"
        assert result["params"]["symbols"] == "AAPL,MSFT"

    async def test_options_request_url(self, adapter):
        class FakeClient:
            async def get(self, url, headers, timeout):
                return {"url": url}

        result = await adapter.make_request(FakeClient(), ["AAPL"], "options")
        assert result["url"] == f"{adapter.base_url}/v1/vq/options/AAPL/chain"

    async def test_unknown_asset_type_returns_empty_dict(self, adapter):
        result = await adapter.make_request(None, ["AAPL"], "bogus")
        assert result == {}
