from datetime import datetime

Symbols = ["BTC/USDT", "ETH/USDT", "SOL/USDT", "DOT/USDT", "USD", "JPY", "ZAR", "EUR"]

intervals = ["1d", "1w", "1m"]

default_start_date = datetime(2026, 1, 1, 0, 0, 0)

profiles = {
    "BTC/USDT": {"base_price": 65000.00},
    "ETH/USDT": {"base_price": 3000.00},
    "SOL/USDT": {"base_price": 140.00},
    "DOT/USDT": {"base_price": 7.50}
}

PlaceholderTicker = [
    {
    "timestamp": "2026-05-18T00:00:00",
    "symbol": "ETH/USDT",
    "interval": "1d",
    "open": 3400.00,
    "high": 3485.50,
    "low": 3315.20,
    "close": 3462.10,
    "volume": 4850.20
  },
  {
    "timestamp": "2026-05-19T00:00:00",
    "symbol": "ETH/USDT",
    "interval": "1d",
    "open": 3462.10,
    "high": 3520.00,
    "low": 3410.65,
    "close": 3435.40,
    "volume": 3922.15
  },
  {
    "timestamp": "2026-05-11T00:00:00",
    "symbol": "SOL/USDT",
    "interval": "1w",
    "open": 145.50,
    "high": 158.20,
    "low": 139.10,
    "close": 154.75,
    "volume": 12450.60
  },
  {
    "timestamp": "2026-05-18T00:00:00",
    "symbol": "SOL/USDT",
    "interval": "1w",
    "open": 154.75,
    "high": 162.00,
    "low": 148.30,
    "close": 151.10,
    "volume": 14102.35
  },
  {
    "timestamp": "2026-03-01T00:00:00",
    "symbol": "XRP/USDT",
    "interval": "1m",
    "open": 0.55,
    "high": 0.61,
    "low": 0.52,
    "close": 0.58,
    "volume": 450120.00
  },
  {
    "timestamp": "2026-04-01T00:00:00",
    "symbol": "XRP/USDT",
    "interval": "1m",
    "open": 0.58,
    "high": 0.59,
    "low": 0.49,
    "close": 0.51,
    "volume": 512980.50
  }
]