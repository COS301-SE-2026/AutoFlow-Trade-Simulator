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
