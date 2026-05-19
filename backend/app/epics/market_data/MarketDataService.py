
from .MarketDataDTOs import MockOHLCV, EpicStatusDTO
from datetime import datetime
from typing import Optional, Any, List
from .generator import LCGPseudoRandomGenerator
from .tickers import Symbols, intervals, default_start_date, profiles, PlaceholderTicker
from fastapi import HTTPException


class MarketDataService:

    def __init__(self):
        self.lcg = LCGPseudoRandomGenerator(101)

    def generate_history(self, payload: Optional[dict] = None) -> List[dict[str, Any]]:
        
        data = payload or {}

        #Do some validation on the symbol
        symbol = data.get("symbol") or self.lcg.choice(Symbols)
        if symbol not in profiles:
            raise ValueError(f"Symbol '{symbol}' is not supported")

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

    @staticmethod
    def get_mock_ticker_data():
        return PlaceholderTicker

    def get_asset_prices_data(self, ticker: str, timeframe: str):

        #Make the symbol name smth we can process
        FormattedSymbol = ticker.upper().replace("-", "/")

        #If its an invalid symbol throw the expected 404
        if FormattedSymbol not in profiles:
            raise HTTPException(
                status_code=404,
                detail="Invalid symbol"
            )
        
        #Validate the times and throw the expected 422 invalid time stamp error
        allowed_intervals = ["1d", "1w", "1m"]

        if timeframe not in allowed_intervals:
             raise HTTPException(
                status_code=422,
                detail="Invalid time"
            )
    
        #Payload construction
        payload = {
            "symbol": FormattedSymbol,
            "interval": timeframe,
        }

        RawData = self.generate_history(payload)
        return RawData

    def get_asset_summary_data(self, ticker: str):

        #Exact same logic as the function above it when it comes to validating the ticker
        FormattedSymbol = ticker.upper().replace("-", "/")
        if FormattedSymbol not in profiles:
            raise HTTPException(
                status_code=404,
                detail="Invalid symbol"
            )
    
        #Payload construction
        payload = {
            "symbol" : FormattedSymbol,
            "interval" : "1d",
            "count" : 7 
        }

        #Leverage already exsisting logic
        DailyHistory = self.generate_history(payload)

        #Failed to generate the data
        if not DailyHistory:
            raise HTTPException(
                status_code=500,
                detail="Data failed to generate"
            )

        #Python has some really nice features lets use negative indexing
        NewBar = DailyHistory[-1]

        SummaryData = {
            "ticker": FormattedSymbol,
            "current_price": NewBar["close"],
            "daily_high": NewBar["high"],
            "daily_low": NewBar["low"],
            "timestamp": NewBar["timestamp"]
        }

        return SummaryData

