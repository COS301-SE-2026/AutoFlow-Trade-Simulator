"""
Layer 2 — BaseMarketDataAdapter is the shared harvest-loop machinery every
stock poller (Massive, TwelveData, Vectrade) runs through. Layer 1 already
proved each provider's transform_payload is correct in isolation, so here
we fake transform_payload/make_request and only exercise the orchestration:
routing to DB vs flat-file, symbol batching, rate-limit backoff, and the
harvest loop's timing/rotation.
"""
import asyncio
import gzip
import json
import os

import pytest

import base_adapter
import db as db_module
from base_adapter import BaseMarketDataAdapter

pytestmark = pytest.mark.layer2


class _StubAdapter(BaseMarketDataAdapter):
    """Minimal concrete subclass so we can instantiate the ABC directly,
    with make_request/transform_payload swapped in per-test."""

    def __init__(self, *args, make_request_fn=None, transform_fn=None, **kwargs):
        super().__init__(*args, **kwargs)
        self._make_request_fn = make_request_fn
        self._transform_fn = transform_fn

    async def make_request(self, client, symbols, asset):
        return await self._make_request_fn(client, symbols, asset)

    async def transform_payload(self, asset_class, symbols, payload):
        return await self._transform_fn(asset_class, symbols, payload)


def _build_adapter(minimal_config, fake_pools, market_event, make_request_fn, transform_fn=None, db_ctx=None, asset_classes=None):
    cfg = minimal_config(asset_classes or {"stocks": {"enabled": True, "lane": "slow"}})
    return _StubAdapter(
        provider_name="stub",
        config=cfg,
        market_event=market_event,
        pools=fake_pools,
        db_ctx=db_ctx,
        make_request_fn=make_request_fn,
        transform_fn=transform_fn or (lambda *_: asyncio.sleep(0, result=[])),
    )


class TestGetSymbolBatch:
    async def test_returns_batch_from_pool(self, minimal_config, fake_pools, market_event_open, response_factory):
        adapter = _build_adapter(minimal_config, fake_pools, market_event_open, make_request_fn=None)
        batch = await adapter.get_symbol_batch("stocks")
        assert batch == ["AAPL"]  # batch_limits.stocks == 1 from minimal_config

    async def test_missing_asset_pool_returns_empty_and_logs(self, minimal_config, market_event_open):
        adapter = _build_adapter(minimal_config, {"stocks": _EmptyPool()}, market_event_open, make_request_fn=None)
        batch = await adapter.get_symbol_batch("stocks")
        assert batch == []


class _EmptyPool:
    async def dequeue_batch(self, n):
        return []


class TestFetchAndStoreFlatFileMode:
    async def test_saves_to_lake_when_db_mode_disabled(self, minimal_config, fake_pools, market_event_open, response_factory, tmp_path, monkeypatch):
        monkeypatch.setattr(db_module, "DB_MODE", False)
        monkeypatch.setattr(os, "getenv", lambda key, default=None: str(tmp_path) if key == "DATA_LAKE_ROOT" else default)

        async def make_request_fn(client, symbols, asset):
            return response_factory(json_body={"results": [{"symbol": symbols[0]}]}, status_code=200)

        adapter = _build_adapter(minimal_config, fake_pools, market_event_open, make_request_fn)
        # storage_root was already resolved in __init__ before our monkeypatch; set directly instead
        adapter.storage_root = str(tmp_path)

        await adapter.fetch_and_store(0)

        written_files = list(tmp_path.rglob("*.jsonl.gz"))
        assert len(written_files) == 1
        with gzip.open(written_files[0], "rt") as f:
            envelope = json.loads(f.readline())
        assert envelope["raw_payload"] == {"results": [{"symbol": "AAPL"}]}

    async def test_no_symbols_skips_request_entirely(self, minimal_config, market_event_open):
        calls = []

        async def make_request_fn(client, symbols, asset):
            calls.append(symbols)
            return None

        adapter = _build_adapter(minimal_config, {"stocks": _EmptyPool()}, market_event_open, make_request_fn)
        await adapter.fetch_and_store(0)
        assert calls == []  # never reached make_request because symbols was empty

    async def test_empty_payload_is_not_persisted(self, minimal_config, fake_pools, market_event_open, response_factory, tmp_path, monkeypatch):
        monkeypatch.setattr(db_module, "DB_MODE", False)

        async def make_request_fn(client, symbols, asset):
            return response_factory(json_body=None, status_code=200)

        adapter = _build_adapter(minimal_config, fake_pools, market_event_open, make_request_fn)
        adapter.storage_root = str(tmp_path)

        # An httpx.Response with empty content -> response.json() raises; but payload falsy
        # check happens after json parse. Use an empty dict body instead to hit the "falsy" branch.
        async def make_request_fn_empty_dict(client, symbols, asset):
            return response_factory(json_body={}, status_code=200)
        adapter._make_request_fn = make_request_fn_empty_dict

        await adapter.fetch_and_store(0)
        assert list(tmp_path.rglob("*.jsonl.gz")) == []

    async def test_rate_limit_response_logs_and_does_not_raise(self, minimal_config, fake_pools, market_event_open, response_factory, caplog):
        async def make_request_fn(client, symbols, asset):
            return response_factory(json_body={"error": "slow down"}, status_code=429)

        adapter = _build_adapter(minimal_config, fake_pools, market_event_open, make_request_fn)
        await adapter.fetch_and_store(0)  # should not raise

    async def test_http_error_status_is_caught_and_logged_not_raised(self, minimal_config, fake_pools, market_event_open, response_factory):
        async def make_request_fn(client, symbols, asset):
            return response_factory(json_body={"error": "server error"}, status_code=500)

        adapter = _build_adapter(minimal_config, fake_pools, market_event_open, make_request_fn)
        await adapter.fetch_and_store(0)  # fetch_and_store wraps in try/except -> no raise

    async def test_transport_exception_is_caught_and_logged(self, minimal_config, fake_pools, market_event_open):
        async def make_request_fn(client, symbols, asset):
            raise ConnectionError("network down")

        adapter = _build_adapter(minimal_config, fake_pools, market_event_open, make_request_fn)
        await adapter.fetch_and_store(0)  # should not propagate


class TestRouteToDbMode:
    async def test_routes_rows_to_fast_queue_for_fast_lane_asset(self, minimal_config, fake_pools, market_event_open, response_factory, monkeypatch):
        monkeypatch.setattr(db_module, "DB_MODE", True)

        fast_queue = asyncio.Queue()
        slow_queue = asyncio.Queue()

        class FakeAssetCache:
            async def get_or_create_asset_id(self, symbol, asset_class, exchange, currency):
                return 42

        db_ctx = {
            "asset_cache": FakeAssetCache(),
            "fast_queue": fast_queue,
            "slow_queue": slow_queue,
            "asset_class_maps": {},
        }

        async def make_request_fn(client, symbols, asset):
            return response_factory(json_body={"ok": True}, status_code=200)

        async def transform_fn(asset_class, symbols, payload):
            return [{"symbol": "AAPL", "table": "dailyohlcv", "open": 1, "high": 2, "low": 0.5, "close": 1.5, "volume": 10}]

        adapter = _build_adapter(
            minimal_config, fake_pools, market_event_open, make_request_fn,
            transform_fn=transform_fn, db_ctx=db_ctx,
            asset_classes={"stocks": {"enabled": True, "lane": "fast"}},
        )
        await adapter.fetch_and_store(0)

        assert slow_queue.empty()
        table, row = await asyncio.wait_for(fast_queue.get(), timeout=1)
        assert table == "dailyohlcv"
        assert row["asset_id"] == 42
        assert "symbol" not in row  # popped before enqueue

    async def test_routes_to_slow_queue_by_default(self, minimal_config, fake_pools, market_event_open, response_factory, monkeypatch):
        monkeypatch.setattr(db_module, "DB_MODE", True)
        fast_queue, slow_queue = asyncio.Queue(), asyncio.Queue()

        class FakeAssetCache:
            async def get_or_create_asset_id(self, **kwargs):
                return 1

        db_ctx = {"asset_cache": FakeAssetCache(), "fast_queue": fast_queue, "slow_queue": slow_queue, "asset_class_maps": {}}

        async def make_request_fn(client, symbols, asset):
            return response_factory(json_body={"ok": True}, status_code=200)

        async def transform_fn(asset_class, symbols, payload):
            return [{"symbol": "AAPL", "table": "realtimeticks", "price": 1, "volume": 1}]

        adapter = _build_adapter(
            minimal_config, fake_pools, market_event_open, make_request_fn,
            transform_fn=transform_fn, db_ctx=db_ctx,
            asset_classes={"stocks": {"enabled": True, "lane": "slow"}},
        )
        await adapter.fetch_and_store(0)
        assert fast_queue.empty()
        assert not slow_queue.empty()

    async def test_symbol_override_reclassifies_asset_type(self, minimal_config, fake_pools, market_event_open, response_factory, monkeypatch):
        monkeypatch.setattr(db_module, "DB_MODE", True)
        fast_queue, slow_queue = asyncio.Queue(), asyncio.Queue()

        seen = {}

        class FakeAssetCache:
            async def get_or_create_asset_id(self, symbol, asset_class, exchange, currency):
                seen["asset_class"] = asset_class
                return 7

        db_ctx = {
            "asset_cache": FakeAssetCache(), "fast_queue": fast_queue, "slow_queue": slow_queue,
            "asset_class_maps": {"stocks": {"AAPL": "megacap"}},
        }

        async def make_request_fn(client, symbols, asset):
            return response_factory(json_body={"ok": True}, status_code=200)

        async def transform_fn(asset_class, symbols, payload):
            return [{"symbol": "AAPL", "table": "dailyohlcv", "open": 1, "high": 1, "low": 1, "close": 1, "volume": 1}]

        adapter = _build_adapter(
            minimal_config, fake_pools, market_event_open, make_request_fn,
            transform_fn=transform_fn, db_ctx=db_ctx,
        )
        await adapter.fetch_and_store(0)
        assert seen["asset_class"] == "megacap"

    async def test_convert_to_stocks_mapping_applies_when_no_override(self, minimal_config, fake_pools, market_event_open, response_factory, monkeypatch):
        monkeypatch.setattr(db_module, "DB_MODE", True)
        fast_queue, slow_queue = asyncio.Queue(), asyncio.Queue()

        seen = {}

        class FakeAssetCache:
            async def get_or_create_asset_id(self, symbol, asset_class, exchange, currency):
                seen["asset_class"] = asset_class
                return 7

        db_ctx = {"asset_cache": FakeAssetCache(), "fast_queue": fast_queue, "slow_queue": slow_queue, "asset_class_maps": {}}

        async def make_request_fn(client, symbols, asset):
            return response_factory(json_body={"ok": True}, status_code=200)

        async def transform_fn(asset_class, symbols, payload):
            return [{"symbol": "AAPL", "table": "dailyohlcv", "open": 1, "high": 1, "low": 1, "close": 1, "volume": 1}]

        adapter = _build_adapter(
            minimal_config, fake_pools, market_event_open, make_request_fn,
            transform_fn=transform_fn, db_ctx=db_ctx,
            asset_classes={"twelve_stocks": {"enabled": True, "lane": "fast"}},
        )
        # pools keyed by asset class name used in config; reuse fake_pools' "stocks" pool under new key
        adapter.pools = {"twelve_stocks": fake_pools["stocks"]}
        await adapter.fetch_and_store(0)
        assert seen["asset_class"] == "stocks"

    async def test_empty_rows_from_transform_short_circuits_before_queueing(self, minimal_config, fake_pools, market_event_open, response_factory, monkeypatch):
        monkeypatch.setattr(db_module, "DB_MODE", True)
        fast_queue, slow_queue = asyncio.Queue(), asyncio.Queue()
        db_ctx = {"asset_cache": None, "fast_queue": fast_queue, "slow_queue": slow_queue, "asset_class_maps": {}}

        async def make_request_fn(client, symbols, asset):
            return response_factory(json_body={"ok": True}, status_code=200)

        async def transform_fn(asset_class, symbols, payload):
            return []  # nothing to route -> must not touch asset_cache (which is None here)

        adapter = _build_adapter(
            minimal_config, fake_pools, market_event_open, make_request_fn,
            transform_fn=transform_fn, db_ctx=db_ctx,
        )
        await adapter.fetch_and_store(0)  # would raise if it tried to use asset_cache=None
        assert fast_queue.empty() and slow_queue.empty()


class TestRunHarvestLoopTiming:
    async def test_loop_waits_for_market_event_when_run_during_close_is_false(self, minimal_config, fake_pools):
        market_event = asyncio.Event()  # closed
        calls = []

        async def make_request_fn(client, symbols, asset):
            calls.append(1)
            return None

        adapter = _build_adapter(
            minimal_config, fake_pools, market_event, make_request_fn,
            asset_classes={"stocks": {"enabled": True, "lane": "slow"}},
        )
        adapter.config["stocks"] = {}  # no-op
        adapter.run_during_market_close = False

        task = asyncio.create_task(adapter.run_harvest_loop())
        await asyncio.sleep(0.05)
        assert calls == []  # market closed -> loop is blocked on market_event.wait()
        task.cancel()
        with pytest.raises(asyncio.CancelledError):
            await task

    async def test_loop_runs_immediately_when_run_during_market_close_true(self, minimal_config, fake_pools, market_event_open):
        calls = []

        async def make_request_fn(client, symbols, asset):
            calls.append(1)
            return None

        adapter = _build_adapter(
            minimal_config, fake_pools, market_event_open, make_request_fn,
            asset_classes={"stocks": {"enabled": True, "lane": "slow"}},
        )
        adapter.run_during_market_close = True
        adapter.seconds_per_request = 0.01

        task = asyncio.create_task(adapter.run_harvest_loop())
        await asyncio.sleep(0.05)
        task.cancel()
        with pytest.raises(asyncio.CancelledError):
            await task
        assert len(calls) >= 1

    async def test_counter_rotates_across_multiple_enabled_asset_classes(self, minimal_config, fake_pools, market_event_open):
        seen_assets = []

        async def make_request_fn(client, symbols, asset):
            return None

        adapter = _build_adapter(
            minimal_config, fake_pools, market_event_open, make_request_fn,
            asset_classes={"stocks": {"enabled": True, "lane": "slow"}, "forex": {"enabled": True, "lane": "slow"}},
        )
        adapter.pools = {"stocks": fake_pools["stocks"], "forex": fake_pools["stocks"]}
        adapter.seconds_per_request = 0.0

        # patch fetch_and_store to record which asset index/name gets used
        original_get_batch = adapter.get_symbol_batch

        async def spy_get_symbol_batch(asset):
            seen_assets.append(asset)
            return await original_get_batch(asset)

        adapter.get_symbol_batch = spy_get_symbol_batch

        task = asyncio.create_task(adapter.run_harvest_loop())
        await asyncio.sleep(0.05)
        task.cancel()
        with pytest.raises(asyncio.CancelledError):
            await task

        assert "stocks" in seen_assets
        assert "forex" in seen_assets  # counter must rotate through both enabled classes
