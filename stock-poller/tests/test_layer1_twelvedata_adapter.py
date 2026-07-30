import pytest

from adapters import TwelveDataAdapter

pytestmark = pytest.mark.layer1


@pytest.fixture
def adapter(minimal_config, fake_pools, market_event_open):
    cfg = minimal_config({"twelve_stocks": {"enabled": True, "lane": "fast"}})
    return TwelveDataAdapter(config=cfg, pools=fake_pools, market_event=market_event_open)


VALID_PAYLOAD = {
    "meta": {"symbol": "AAPL", "currency": "USD", "exchange": "NASDAQ"},
    "values": [
        {"datetime": "2026-07-28 09:30:00", "open": "190.0", "high": "191.0", "low": "189.5", "close": "190.5", "volume": "12345"},
    ],
    "status": "ok",
}


class TestTwelveDataValidation:
    def test_valid_payload_passes(self, adapter):
        ok, _ = adapter._validate_payload(VALID_PAYLOAD)
        assert ok is True

    def test_non_dict_root_rejected(self, adapter):
        ok, msg = adapter._validate_payload("not-a-dict")
        assert ok is False

    def test_missing_meta_rejected(self, adapter):
        bad = {k: v for k, v in VALID_PAYLOAD.items() if k != "meta"}
        ok, msg = adapter._validate_payload(bad)
        assert ok is False
        assert "meta" in msg

    def test_missing_status_rejected(self, adapter):
        bad = {k: v for k, v in VALID_PAYLOAD.items() if k != "status"}
        ok, msg = adapter._validate_payload(bad)
        assert ok is False

    def test_meta_missing_field_rejected(self, adapter):
        bad_meta = {k: v for k, v in VALID_PAYLOAD["meta"].items() if k != "exchange"}
        bad = {**VALID_PAYLOAD, "meta": bad_meta}
        ok, msg = adapter._validate_payload(bad)
        assert ok is False
        assert "meta:" in msg

    def test_values_item_wrong_type_rejected(self, adapter):
        bad_value = {**VALID_PAYLOAD["values"][0], "open": 190.0}  # should be str per spec
        bad = {**VALID_PAYLOAD, "values": [bad_value]}
        ok, msg = adapter._validate_payload(bad)
        assert ok is False


class TestTwelveDataTransform:
    async def test_transform_produces_expected_row(self, adapter):
        rows = await adapter.transform_payload("twelve_stocks", ["AAPL"], VALID_PAYLOAD)
        assert len(rows) == 1
        row = rows[0]
        assert row["symbol"] == "AAPL"
        assert row["exchange"] == "NASDAQ"
        assert row["currency"] == "USD"
        assert row["open"] == "190.0"  # note: strings pass through untouched here
        assert row["table"] == "dailyohlcv"

    async def test_transform_returns_empty_on_invalid_payload(self, adapter):
        rows = await adapter.transform_payload("twelve_stocks", ["AAPL"], {"bad": True})
        assert rows == []
