
from .MarketDataDTOs import MockOHLCV
from datetime import datetime
from typing import Optional
from .generator import LCGPseudoRandomGenerator
from .tickers import Symbols, intervals, default_start_date, profiles


class MarketDataService:

    def __init__(self):
        self.lcg = LCGPseudoRandomGenerator(101)

    def generate_history(self, payload: Optional[dict] = None) -> str:
        
        data = payload or {}

        #Do some validation on the symbol
        symbol = data.get("symbol") or self.lcg.choice(Symbols)
        if symbol not in profiles:
            raise ValueError("Symbol '{symbol}' is not supported")

        profile = profiles[symbol]

        #Do validation on the intervals date count and base price
        interval = data.get("interval") or self.lcg.choice(intervals)
        start_date = data.get("start_date") or default_start_date
        count = data.get("count") or 5
        base_price = data.get("base_price") or profile["base_price"]

        #No that all validation is done hand it to or LCG gen
        return self.lcg.generate_market_history(symbol, interval, start_date, count, base_price)

    @staticmethod
    def get_status() -> EpicStatusDTO:
        return EpicStatusDTO(
            epic="market_data",
            status="scaffolded",
        )
