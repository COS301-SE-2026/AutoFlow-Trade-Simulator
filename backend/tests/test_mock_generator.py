import pytest
from app.epics.market_data.generator import LCGPseudoRandomGenerator
from datetime import datetime


def test_high_gte_close_gte_low():
    lcg = LCGPseudoRandomGenerator(seed=42)
    history = lcg.generate_market_history(
        "BTC/USDT", "1d", datetime(2026, 1, 1), count=50, base_price=65000.0)
    for h in history:
        assert h["high"] >= h["close"]
        assert h["close"] >= h["low"]


def test_volume_positive():
    lcg = LCGPseudoRandomGenerator(seed=42)
    history = lcg.generate_market_history(
        "BTC/USDT", "1d", datetime(2026, 1, 1), count=50, base_price=65000.0)
    for h in history:
        assert h["volume"] >= 0


def test_timestamps_contiguous_daily():
    lcg = LCGPseudoRandomGenerator(seed=42)
    history = lcg.generate_market_history(
        "BTC/USDT", "1d", datetime(2026, 1, 1), count=10, base_price=65000.0)

    for i in range(1, len(history)):
        t_prev = datetime.fromisoformat(history[i - 1]["timestamp"])
        t_curr = datetime.fromisoformat(history[i]["timestamp"])
        diff = (t_curr - t_prev).days
        assert diff == 1


def test_timestamps_contiguous_weekly():
    lcg = LCGPseudoRandomGenerator(seed=42)
    history = lcg.generate_market_history(
        "BTC/USDT", "1w", datetime(2026, 1, 1), count=10, base_price=65000.0)

    for i in range(1, len(history)):
        t_prev = datetime.fromisoformat(history[i - 1]["timestamp"])
        t_curr = datetime.fromisoformat(history[i]["timestamp"])
        diff = (t_curr - t_prev).days
        assert diff == 7


def test_timestamps_contiguous_monthly():
    lcg = LCGPseudoRandomGenerator(seed=42)
    history = lcg.generate_market_history(
        "BTC/USDT", "1m", datetime(2026, 1, 1), count=10, base_price=65000.0)

    for i in range(1, len(history)):
        t_prev = datetime.fromisoformat(history[i - 1]["timestamp"])
        t_curr = datetime.fromisoformat(history[i]["timestamp"])
        diff = (t_curr - t_prev).days
        assert diff == 30


def test_fixed_seed_same_output():
    seed = 42
    size = 10

    lcg_1 = LCGPseudoRandomGenerator(seed)
    history_1 = lcg_1.generate_market_history(
        "BTC/USDT", "1m", datetime(2026, 1, 1), count=size, base_price=65000.0)

    lcg_2 = LCGPseudoRandomGenerator(seed)
    history_2 = lcg_2.generate_market_history(
        "BTC/USDT", "1m", datetime(2026, 1, 1), count=size, base_price=65000.0)

    for i in range(1, size):
        assert history_1[i] == history_2[i]


def test_invalid_interval_raises():
    lcg = LCGPseudoRandomGenerator(seed=42)
    with pytest.raises(ValueError):
        lcg.generate_market_history(
            "BTC/USDT", "bad", datetime(2026, 1, 1), count=5, base_price=65000.0)
