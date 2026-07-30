"""
Layer 4 — db.py is the bottom of the write path (top of the read-up stack):
AssetCache resolves symbol -> asset_id, and upsert_* persists rows that
IngestWorker (layer 3) hands it. No real Postgres involved: FakePool/
FakeConnection from conftest record what SQL *would* run.
"""
from datetime import datetime, timezone

import pytest

from db import AssetCache, upsert_realtime_ticks, upsert_daily_ohlcv, upsert_options, _naive_utc

pytestmark = pytest.mark.layer4


class TestNaiveUtc:
    def test_converts_aware_datetime_to_naive_utc(self):
        aware = datetime(2026, 7, 28, 12, 0, tzinfo=timezone.utc)
        result = _naive_utc(aware)
        assert result.tzinfo is None
        assert result.hour == 12

    def test_leaves_naive_datetime_untouched(self):
        naive = datetime(2026, 7, 28, 12, 0)
        assert _naive_utc(naive) == naive


class TestAssetCache:
    async def test_returns_cached_value_without_hitting_db(self, fake_pool, fake_connection):
        cache = AssetCache(fake_pool)
        cache._cache["AAPL"] = 99
        result = await cache.get_or_create_asset_id("AAPL", "stocks", "US", "USD")
        assert result == 99
        assert fake_connection.fetchrow_calls == []

    async def test_existing_row_is_looked_up_not_inserted(self, fake_pool, fake_connection):
        fake_connection.fetchrow_queue = [{"asset_id": 5}]
        cache = AssetCache(fake_pool)
        result = await cache.get_or_create_asset_id("AAPL", "stocks", "US", "USD")
        assert result == 5
        assert len(fake_connection.fetchrow_calls) == 1
        assert "SELECT asset_id" in fake_connection.fetchrow_calls[0][0]

    async def test_missing_row_triggers_insert(self, fake_pool, fake_connection):
        fake_connection.fetchrow_queue = [None, {"asset_id": 12}]
        cache = AssetCache(fake_pool)
        result = await cache.get_or_create_asset_id("NEWSYM", "stocks", "US", "USD")
        assert result == 12
        assert len(fake_connection.fetchrow_calls) == 2
        assert "INSERT INTO asset" in fake_connection.fetchrow_calls[1][0]

    async def test_result_is_cached_after_lookup(self, fake_pool, fake_connection):
        fake_connection.fetchrow_queue = [{"asset_id": 5}]
        cache = AssetCache(fake_pool)
        await cache.get_or_create_asset_id("AAPL", "stocks", "US", "USD")
        assert cache._cache["AAPL"] == 5
        # second call should not touch the DB again
        result = await cache.get_or_create_asset_id("AAPL", "stocks", "US", "USD")
        assert result == 5
        assert len(fake_connection.fetchrow_calls) == 1


class TestUpsertRealtimeTicks:
    async def test_no_rows_skips_db_call_entirely(self, fake_pool, fake_connection):
        await upsert_realtime_ticks(fake_pool, [])
        assert fake_connection.executemany_calls == []

    async def test_rows_passed_through_as_expected_tuple_order(self, fake_pool, fake_connection):
        ts = datetime(2026, 7, 28, tzinfo=timezone.utc)
        rows = [{"asset_id": 1, "timestamp": ts, "price": 100.0, "volume": 5.0}]
        await upsert_realtime_ticks(fake_pool, rows)
        assert len(fake_connection.executemany_calls) == 1
        _, args = fake_connection.executemany_calls[0]
        assert args == [(1, ts.replace(tzinfo=None), 100.0, 5.0)]


class TestUpsertDailyOhlcv:
    async def test_no_rows_skips_db_call(self, fake_pool, fake_connection):
        await upsert_daily_ohlcv(fake_pool, [])
        assert fake_connection.executemany_calls == []

    async def test_rows_mapped_correctly(self, fake_pool, fake_connection):
        ts = datetime(2026, 7, 28)
        rows = [{"asset_id": 2, "timestamp": ts, "open": 1, "high": 2, "low": 0.5, "close": 1.5, "volume": 10}]
        await upsert_daily_ohlcv(fake_pool, rows)
        _, args = fake_connection.executemany_calls[0]
        assert args == [(2, ts, 1, 2, 0.5, 1.5, 10)]


class TestUpsertOptions:
    async def test_no_rows_skips_db_call(self, fake_pool, fake_connection):
        await upsert_options(fake_pool, [])
        assert fake_connection.executemany_calls == []

    async def test_rows_mapped_in_column_order(self, fake_pool, fake_connection):
        ts = datetime(2026, 7, 28)
        rows = [{
            "contract_symbol": "AAPL260821C00200000", "timestamp": ts, "asset_id": 3,
            "option_type": "CALL", "strike_price": 200.0, "expr_date": ts,
            "bid": 5.4, "ask": 5.6, "last_price": 5.5, "volume": 100,
            "open_interest": 500, "imp_vol": 0.25, "in_the_money": False,
        }]
        await upsert_options(fake_pool, rows)
        _, args = fake_connection.executemany_calls[0]
        assert args[0][0] == "AAPL260821C00200000"
        assert args[0][3] == "CALL"
        assert args[0][-1] is False
