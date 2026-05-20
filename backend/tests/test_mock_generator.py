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
