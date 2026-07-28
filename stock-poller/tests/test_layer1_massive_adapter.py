"""
Layer 1 — MassiveAdapter is one of the two "stock poller" daily-OHLCV
providers. Its transform_payload/_validate_payload are pure (dict in,
list[dict] out) so they're tested with zero mocking, no event loop needed
beyond what pytest-asyncio gives make_request its own smaller test.
"""
import pytest

from adapters import MassiveAdapter

pytestmark = pytest.mark.layer1


@pytest.fixture
def adapter(minimal_config, fake_pools, market_event_open):
    cfg = minimal_config({"stocks": {"enabled": True, "lane": "slow"}})
    return MassiveAdapter(config=cfg, pools=fake_pools, market_event=market_event_open)


VALID_PAYLOAD = {
    "ticker": "AAPL",
    "results": [
        {"o": 190.0, "T": "AAPL", "h": 195.0, "l": 189.0, "c": 193.5, "v": 1_000_000.0, "t": 1753660800000},
    ],
}


class TestMassiveValidation:
    def test_valid_payload_passes(self, adapter):
        ok, msg = adapter._validate_payload(VALID_PAYLOAD)
        assert ok is True

    def test_non_dict_root_rejected(self, adapter):
        ok, msg = adapter._validate_payload(["not", "a", "dict"])
        assert ok is False
        assert "object" in msg

    def test_missing_ticker_rejected(self, adapter):
        bad = {k: v for k, v in VALID_PAYLOAD.items() if k != "ticker"}
        ok, msg = adapter._validate_payload(bad)
        assert ok is False
        assert "ticker" in msg

    def test_empty_results_rejected(self, adapter):
        bad = {**VALID_PAYLOAD, "results": []}
        ok, msg = adapter._validate_payload(bad)
        assert ok is False

    def test_result_missing_required_field_rejected(self, adapter):
        bad_result = {k: v for k, v in VALID_PAYLOAD["results"][0].items() if k != "c"}
        bad = {**VALID_PAYLOAD, "results": [bad_result]}
        ok, msg = adapter._validate_payload(bad)
        assert ok is False


class TestMassiveTransform:
    async def test_transform_produces_expected_row(self, adapter):
        rows = await adapter.transform_payload("stocks", ["AAPL"], VALID_PAYLOAD)
        assert len(rows) == 1
        row = rows[0]
        assert row["symbol"] == "AAPL"
        assert row["table"] == "dailyohlcv"
        assert row["open"] == 190.0
        assert row["high"] == 195.0
        assert row["low"] == 189.0
        assert row["close"] == 193.5
        assert row["volume"] == 1_000_000.0
        assert row["exchange"] == "US"
        assert row["currency"] == "USD"
        # 1753660800000 ms -> 2025-07-28T00:00:00Z, converted to naive
        assert row["timestamp"].tzinfo is None

    async def test_transform_returns_empty_on_invalid_payload(self, adapter):
        rows = await adapter.transform_payload("stocks", ["AAPL"], {"bad": "payload"})
        assert rows == []

    async def test_transform_handles_multiple_results(self, adapter):
        payload = {
            "ticker": "AAPL",
            "results": [VALID_PAYLOAD["results"][0], {**VALID_PAYLOAD["results"][0], "T": "MSFT"}],
        }
        rows = await adapter.transform_payload("stocks", ["AAPL"], payload)
        assert {r["symbol"] for r in rows} == {"AAPL", "MSFT"}


class TestMassiveMakeRequest:
    async def test_make_request_hits_expected_url_and_params(self, adapter, monkeypatch):
        captured = {}

        class FakeClient:
            async def get(self, url, params, timeout):
                captured["url"] = url
                captured["params"] = params
                captured["timeout"] = timeout
                return "fake-response"

        result = await adapter.make_request(FakeClient(), ["AAPL"], "stocks")
        assert result == "fake-response"
        assert captured["url"] == f"{adapter.base_url}/v2/aggs/ticker/AAPL/prev"
        assert captured["params"]["apiKey"] == adapter.api_key
        assert captured["params"]["adjusted"] == "true"
