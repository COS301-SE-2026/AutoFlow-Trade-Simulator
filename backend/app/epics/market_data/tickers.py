from datatime import datetime

Symbols = ["BTC/USDT", "ETH/USDT", "SOL/USDT", "DOT/USDT", "USD", "JPY", "ZAR", "EUR"]

intervals = ["1d", "1w", "1m"]

default_start_date = datetime(2026, 1, 1, 0, 0, 0)

profiles = {
    "BTC/USDT": {"base_price": 65000.00},
    "ETH/USDT": {"base_price": 3000.00},
    "SOL/USDT": {"base_price": 140.00},
    "DOT/USDT": {"base_price": 7.50}
}