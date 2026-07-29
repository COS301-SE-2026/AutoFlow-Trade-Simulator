"""
Shared fixtures for the bottom-up test suite.

Layering strategy (see pytest.ini markers):
  layer0 - pure helpers (_type_ok, _validate_fields, _build_ohlcv_row, TickerRingBuffer)
  layer1 - per-provider validate_payload / transform_payload (still pure: dict in, list[dict] out)
  layer2 - BaseMarketDataAdapter (fetch_and_store, _route_to_db, get_symbol_batch, run_harvest_loop)
           -> mocks httpx responses and the layer1 transform, so failures here are orchestration bugs
  layer3 - IngestWorker / build_lanes (mocks db.upsert_* so failures here are lane/queue bugs, not SQL)
  layer4 - db.py AssetCache + upsert_* (mocks asyncpg.Pool/Connection, so failures here are SQL wiring bugs)
  layer5 - main.py wiring (market clock, pool build) with everything below it faked

Each layer only fakes the layer directly beneath it. That's the point of "bottom-up":
by the time you're debugging layer2, layers 0-1 already have their own green tests,
so a layer2 failure can't be "actually a validation bug in disguise".
"""
import asyncio
import os
import sys
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock

import httpx
import pytest

# Make `import adapters`, `import base_adapter`, `import db`, etc. resolve
# regardless of the directory pytest is invoked from. The source modules
# live one level up from this tests/ folder (project root), and pytest
# does not reliably add that directory to sys.path on its own -- so we do
# it explicitly here rather than depending on cwd or an installed package.
_PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if _PROJECT_ROOT not in sys.path:
    sys.path.insert(0, _PROJECT_ROOT)

def make_response(json_body=None, status_code=200):
    """Build a real httpx.Response so response.json()/.status_code behave exactly
    like production, instead of hand-rolling a fake object that might drift."""
    request = httpx.Request("GET", "https://example.test/mock")
    content = b"" if json_body is None else httpx.Response(200, json=json_body).content
    return httpx.Response(status_code=status_code, content=content, request=request)


@pytest.fixture
def response_factory():
    return make_response


@pytest.fixture
def minimal_config():
    def _build(asset_classes, **overrides):
        cfg = {
            "base_url": "https://api.example.test",
            "run_during_market_close": True,
            "seconds_per_request": 0.0,
            "key_param_name": "apikey",
            "api_key_env_var": "MOCK_TEST_KEY",
            "asset_classes": asset_classes,
            "rest": {"batch_limits": {name: 1 for name in asset_classes}},
        }
        cfg.update(overrides)
        return cfg
    return _build


@pytest.fixture
def market_event_open():
    ev = asyncio.Event()
    ev.set()
    return ev


@pytest.fixture
def fake_pools():
    """A dict of {asset_class: object with async dequeue_batch(n)}."""
    class _Pool:
        def __init__(self, symbols):
            self.symbols = symbols
            self.calls = []

        async def dequeue_batch(self, n):
            self.calls.append(n)
            return self.symbols[:n]

    return {"stocks": _Pool(["AAPL", "MSFT", "NVDA"])}



class FakeConnection:

    def __init__(self):
        self.executemany_calls = []
        self.fetchrow_queue = []  # list of return values, popped in order
        self.fetchrow_calls = []

    async def executemany(self, query, args):
        self.executemany_calls.append((query, args))

    async def fetchrow(self, query, *args):
        self.fetchrow_calls.append((query, args))
        if self.fetchrow_queue:
            return self.fetchrow_queue.pop(0)
        return None


class FakePool:
    def __init__(self, connection: FakeConnection):
        self._connection = connection

    def acquire(self):
        return _AcquireCtx(self._connection)


class _AcquireCtx:
    def __init__(self, connection):
        self._connection = connection

    async def __aenter__(self):
        return self._connection

    async def __aexit__(self, *exc):
        return False


@pytest.fixture
def fake_connection():
    return FakeConnection()


@pytest.fixture
def fake_pool(fake_connection):
    return FakePool(fake_connection)