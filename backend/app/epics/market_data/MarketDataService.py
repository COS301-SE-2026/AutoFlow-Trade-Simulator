
from MarketDataDTOs import MockOHLCV
from datetime import datetime
from typing import Optional
from generator import LCGPseudoRandomGenerator
import tickers


class MarketDataService:

    def __init__(self):
        self.lcg = LCGPseudoRandomGenerator(101)

    def generate_history(self, payload: Optional[dict] = None) -> str:
        
        data = payload or {}

        #Do some validation on the symbol
        symbol = data.get("symbol") or lcg.choice(tickers.Symbols)
        if symbol not in tikcers.profiles:
            raise ValueError("Symbol '{symbol}' is not supported")

        profile = tickers.profiles[symbol]

        #Do validation on the intervals date count and base price
        interval = data.get("interval") or lcg.choice(tickers.intervals)
        start_date = data.get("start_date") or tickers.default_start_date
        count = data.get("count") or 5
        base_price = data.get("base_price") or profile["base_price"]
