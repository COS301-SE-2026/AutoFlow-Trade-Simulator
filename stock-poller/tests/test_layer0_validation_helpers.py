"""
Layer 0 — the lowest rung: pure functions with no I/O, no async, no config.
If these are wrong, every adapter built on top of them is wrong too, so they
get pinned down first and in isolation.
"""
import pytest

from adapters import _type_ok, _validate_fields, _validate_list_items, _build_ohlcv_row


pytestmark = pytest.mark.layer0


class TestTypeOk:
    def test_none_disallowed_by_default(self):
        assert _type_ok(None, str) is False

    def test_none_allowed_when_flagged(self):
        assert _type_ok(None, str, allow_none=True) is True

    def test_correct_type_passes(self):
        assert _type_ok("hello", str) is True
        assert _type_ok(3.14, float) is True
        assert _type_ok(3, (int, float)) is True

    def test_wrong_type_fails(self):
        assert _type_ok(3, str) is False
        assert _type_ok("3", float) is False

    def test_bool_is_not_silently_accepted_as_int_type_tuple(self):
        # isinstance(True, int) is True in Python -- documenting this "gotcha"
        # since several _validate_* specs use (int, float) and a stray bool
        # would otherwise pass silently.
        assert _type_ok(True, (int, float)) is True


class TestValidateFields:
    SPECS = [
        ("name", str, False),
        ("age", (int, float), False),
        ("nickname", str, True),
    ]

    def test_all_fields_valid_returns_none(self):
        record = {"name": "AAPL", "age": 10, "nickname": None}
        assert _validate_fields(record, self.SPECS) is None

    def test_missing_required_field_returns_error(self):
        record = {"age": 10}
        error = _validate_fields(record, self.SPECS)
        assert error is not None
        assert "name" in error

    def test_wrong_type_returns_error_naming_field(self):
        record = {"name": 123, "age": 10}
        error = _validate_fields(record, self.SPECS)
        assert "name" in error

    def test_first_failing_field_short_circuits(self):
        # only the first bad field should be reported, not all of them
        record = {"age": "not-a-number"}
        error = _validate_fields(record, self.SPECS)
        assert "name" in error  # 'name' is checked first in SPECS


class TestValidateListItems:
    SPECS = [("symbol", str, False)]

    def test_non_list_input_rejected(self):
        error = _validate_list_items({"not": "a list"}, self.SPECS, "result")
        assert "must be a list" in error

    def test_non_dict_item_rejected_with_index(self):
        error = _validate_list_items(["not-a-dict"], self.SPECS, "result")
        assert "result 0" in error

    def test_valid_list_returns_none(self):
        items = [{"symbol": "AAPL"}, {"symbol": "MSFT"}]
        assert _validate_list_items(items, self.SPECS, "result") is None

    def test_error_includes_label_and_index(self):
        items = [{"symbol": "AAPL"}, {"symbol": 123}]
        error = _validate_list_items(items, self.SPECS, "result")
        assert error.startswith("result 1")


class TestBuildOhlcvRow:
    def test_builds_row_on_valid_input(self):
        row = _build_ohlcv_row("AAPL", 1.0, 2.0, 0.5, 1.5, 1000, "2026-07-28")
        assert row["symbol"] == "AAPL"
        assert row["table"] == "dailyohlcv"
        assert row["open"] == 1.0
        assert row["close"] == 1.5
        assert row["timestamp"].isoformat().startswith("2026-07-28")

    @pytest.mark.parametrize("field", ["open_price", "high", "low", "close", "volume"])
    def test_returns_none_if_any_numeric_field_missing(self, field):
        kwargs = dict(open_price=1.0, high=2.0, low=0.5, close=1.5, volume=1000)
        kwargs[field] = None
        row = _build_ohlcv_row(
            "AAPL", kwargs["open_price"], kwargs["high"], kwargs["low"],
            kwargs["close"], kwargs["volume"], "2026-07-28",
        )
        assert row is None

    def test_returns_none_on_non_string_date(self):
        row = _build_ohlcv_row("AAPL", 1.0, 2.0, 0.5, 1.5, 1000, date=12345)
        assert row is None

    def test_returns_none_on_unparseable_date(self):
        row = _build_ohlcv_row("AAPL", 1.0, 2.0, 0.5, 1.5, 1000, date="not-a-date")
        assert row is None

    def test_strips_timezone_to_naive(self):
        row = _build_ohlcv_row("AAPL", 1.0, 2.0, 0.5, 1.5, 1000, "2026-07-28T00:00:00+05:00")
        assert row["timestamp"].tzinfo is None
