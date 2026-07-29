"""
Layer 5 — the top of the stack: main.py wires everything below into a
running system. We don't spin up the real event loop of main() (that would
mean touching real Postgres and real HTTP), we test the two pieces of actual
logic main.py owns: the market-clock event broadcaster, and how
ticker_pools/asset_class_maps get built from config.yaml's nested vs flat
structures (this directly determines what each stock poller's
TickerRingBuffer gets populated with).
"""
import asyncio
import zoneinfo
from datetime import datetime
from unittest.mock import patch

import pytest

import main
from base_adapter import TickerRingBuffer

pytestmark = pytest.mark.layer5


def _ny_dt(hour, minute, second, weekday_saturday=False):
    # Pick a known Tuesday (2026-07-28) or a known Saturday for weekend tests.
    day = 25 if weekday_saturday else 28  # 2026-07-25 is a Saturday, 2026-07-28 a Tuesday
    tz = zoneinfo.ZoneInfo("America/New_York")
    return datetime(2026, 7, day, hour, minute, second, tzinfo=tz)


class TestMarketClockBroadcaster:
    async def test_sets_event_during_market_hours(self):
        event = asyncio.Event()
        with patch("main.datetime") as mock_dt:
            mock_dt.now.return_value = _ny_dt(10, 0, 0)
            task = asyncio.create_task(main.market_clock_broadcaster(event))
            await asyncio.sleep(0.05)
            task.cancel()
            with pytest.raises(asyncio.CancelledError):
                await task
        assert event.is_set()

    async def test_clears_event_outside_market_hours(self):
        event = asyncio.Event()
        event.set()
        with patch("main.datetime") as mock_dt:
            mock_dt.now.return_value = _ny_dt(20, 0, 0)  # 8pm, market closed
            task = asyncio.create_task(main.market_clock_broadcaster(event))
            await asyncio.sleep(0.05)
            task.cancel()
            with pytest.raises(asyncio.CancelledError):
                await task
        assert not event.is_set()

    async def test_weekend_clears_event_even_during_daytime_hours(self):
        event = asyncio.Event()
        event.set()
        with patch("main.datetime") as mock_dt:
            mock_dt.now.return_value = _ny_dt(10, 0, 0, weekday_saturday=True)
            task = asyncio.create_task(main.market_clock_broadcaster(event))
            await asyncio.sleep(0.05)
            task.cancel()
            with pytest.raises(asyncio.CancelledError):
                await task
        assert not event.is_set()

    async def test_boundary_market_open_930_is_open(self):
        event = asyncio.Event()
        with patch("main.datetime") as mock_dt:
            mock_dt.now.return_value = _ny_dt(9, 30, 0)
            task = asyncio.create_task(main.market_clock_broadcaster(event))
            await asyncio.sleep(0.05)
            task.cancel()
            with pytest.raises(asyncio.CancelledError):
                await task
        assert event.is_set()

    async def test_boundary_market_close_1600_is_closed(self):
        event = asyncio.Event()
        with patch("main.datetime") as mock_dt:
            mock_dt.now.return_value = _ny_dt(16, 0, 0)
            task = asyncio.create_task(main.market_clock_broadcaster(event))
            await asyncio.sleep(0.05)
            task.cancel()
            with pytest.raises(asyncio.CancelledError):
                await task
        assert not event.is_set()


class TestTickerPoolConstruction:
    """
    Mirrors the ticker_pools -> shared_pools / asset_class_maps logic inlined
    in main(). Extracted here as a standalone check since main() itself is
    not decomposed into a testable function -- this pins the *behavior* so a
    future refactor that extracts it into a real function has a spec to match.
    """

    @staticmethod
    def _build_pools(ticker_pools_cfg):
        shared_pools = {}
        asset_class_maps = {}
        for asset_class, symbols in ticker_pools_cfg.items():
            if isinstance(symbols, dict):
                flat_symbols = []
                symbol_to_subclass = {}
                for sub_class, sub_symbols in symbols.items():
                    flat_symbols.extend(sub_symbols)
                    for sym in sub_symbols:
                        symbol_to_subclass[sym] = sub_class
                shared_pools[asset_class] = TickerRingBuffer(flat_symbols)
                asset_class_maps[asset_class] = symbol_to_subclass
            else:
                shared_pools[asset_class] = TickerRingBuffer(symbols)
        return shared_pools, asset_class_maps

    def test_flat_list_asset_class_builds_simple_ring_buffer(self):
        cfg = {"stocks": ["AAPL", "MSFT"]}
        pools, maps = self._build_pools(cfg)
        assert pools["stocks"].tickers == ["AAPL", "MSFT"]
        assert "stocks" not in maps

    def test_nested_dict_asset_class_flattens_and_builds_subclass_map(self):
        cfg = {"options": {"stocks": ["SPY", "QQQ"], "indices": ["SPX"]}}
        pools, maps = self._build_pools(cfg)
        assert set(pools["options"].tickers) == {"SPY", "QQQ", "SPX"}
        assert maps["options"] == {"SPY": "stocks", "QQQ": "stocks", "SPX": "indices"}

    def test_mixed_flat_and_nested_asset_classes(self):
        cfg = {
            "stocks": ["AAPL"],
            "options": {"stocks": ["SPY"], "commodities": ["XAUUSD"]},
        }
        pools, maps = self._build_pools(cfg)
        assert "stocks" in pools and "options" in pools
        assert "stocks" not in maps
        assert maps["options"] == {"SPY": "stocks", "XAUUSD": "commodities"}
