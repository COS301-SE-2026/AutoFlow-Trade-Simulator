from datetime import datetime

#Sonar qube hates mock data so lets fix that
sol_string = "SOL/USDT"
eth_string = "ETH/USDT"
Symbols = ["BTC/USDT", eth_string, sol_string, "DOT/USDT", "USD", "JPY", "ZAR", "EUR", "AAPL", "GOOGL", "MSFT", "TSLA"]

intervals = ["1d", "1w", "1m"]

default_start_date = datetime(2026, 1, 1, 0, 0, 0)

# Shared mock timestamp used in multiple placeholder entries
COMMON_TIMESTAMP = "2026-05-18T00:00:00"
# Next-day mock timestamp used in multiple placeholder entries
NEXT_TIMESTAMP = "2026-05-19T00:00:00"

profiles = {
    "BTC/USDT": {"base_price": 65000.00},
    eth_string: {"base_price": 3000.00},
    sol_string: {"base_price": 140.00},
    "DOT/USDT": {"base_price": 7.50},
    "AAPL": {"base_price": 185.50},
    "GOOGL": {"base_price": 180.25},
    "MSFT": {"base_price": 425.00},
    "TSLA": {"base_price": 245.75}
}

PlaceholderTicker = [
    {
    "timestamp": COMMON_TIMESTAMP,
    "symbol": eth_string,
    "interval": "1d",
    "open": 3400.00,
    "high": 3485.50,
    "low": 3315.20,
    "close": 3462.10,
    "volume": 4850.20
  },
  {
    "timestamp": NEXT_TIMESTAMP,
    "symbol": eth_string,
    "interval": "1d",
    "open": 3462.10,
    "high": 3520.00,
    "low": 3410.65,
    "close": 3435.40,
    "volume": 3922.15
  },
  {
    "timestamp": "2026-05-11T00:00:00",
    "symbol": sol_string,
    "interval": "1w",
    "open": 145.50,
    "high": 158.20,
    "low": 139.10,
    "close": 154.75,
    "volume": 12450.60
  },
  {
    "timestamp": COMMON_TIMESTAMP,
    "symbol": sol_string,
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
  },
  {
    "timestamp": COMMON_TIMESTAMP,
    "symbol": "AAPL",
    "interval": "1d",
    "open": 183.20,
    "high": 187.50,
    "low": 182.10,
    "close": 185.50,
    "volume": 52340000.00
  },
  {
    "timestamp": NEXT_TIMESTAMP,
    "symbol": "AAPL",
    "interval": "1d",
    "open": 185.50,
    "high": 188.75,
    "low": 184.80,
    "close": 187.20,
    "volume": 48920000.00
  },
  {
    "timestamp": COMMON_TIMESTAMP,
    "symbol": "GOOGL",
    "interval": "1d",
    "open": 178.50,
    "high": 182.00,
    "low": 177.80,
    "close": 180.25,
    "volume": 32450000.00
  },
  {
    "timestamp": NEXT_TIMESTAMP,
    "symbol": "GOOGL",
    "interval": "1d",
    "open": 180.25,
    "high": 183.40,
    "low": 179.75,
    "close": 182.10,
    "volume": 31200000.00
  },
  {
    "timestamp": COMMON_TIMESTAMP,
    "symbol": "MSFT",
    "interval": "1d",
    "open": 420.50,
    "high": 428.00,
    "low": 419.80,
    "close": 425.00,
    "volume": 26780000.00
  },
  {
    "timestamp": NEXT_TIMESTAMP,
    "symbol": "MSFT",
    "interval": "1d",
    "open": 425.00,
    "high": 431.50,
    "low": 424.20,
    "close": 429.75,
    "volume": 25340000.00
  },
  {
    "timestamp": COMMON_TIMESTAMP,
    "symbol": "TSLA",
    "interval": "1d",
    "open": 243.00,
    "high": 248.50,
    "low": 242.10,
    "close": 245.75,
    "volume": 42560000.00
  },
  {
    "timestamp": NEXT_TIMESTAMP,
    "symbol": "TSLA",
    "interval": "1d",
    "open": 245.75,
    "high": 251.20,
    "low": 244.80,
    "close": 250.10,
    "volume": 39780000.00
  }
]
