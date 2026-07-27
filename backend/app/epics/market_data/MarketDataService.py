from .MarketDataDTOs import MockOHLCV, EpicStatusDTO, AssetSummary, MarketHistoryReq
from typing import Optional, List, Union
from .generator import LCGPseudoRandomGenerator
from .tickers import Symbols, intervals, default_start_date, profiles, PlaceholderTicker
from fastapi import HTTPException


class MarketDataService:

    def __init__(self):
        pass

    # 1. Force the return type here to be List[MockOHLCV]
    def generate_history(self, payload: Optional[Union[dict, MarketHistoryReq]] = None) -> List[MockOHLCV]:
        
        if isinstance(payload, MarketHistoryReq):
            data = payload.model_dump(exclude_none=True)
        else:
            data = payload or {}

        #make a seed based off the symbol
        temp_lcg = LCGPseudoRandomGenerator(seed=101)

        #Do some validation on the symbol
        symbol = data.get("symbol") or temp_lcg.choice(Symbols)
        if symbol not in profiles:
            raise ValueError(f"Symbol '{symbol}' is not supported")

        profile = profiles[symbol]

        #Do validation on the intervals date count and base price
        interval = data.get("interval") or temp_lcg.choice(intervals)
        start_date = data.get("start_date") or default_start_date
        count = data.get("count") or 5
        base_price = data.get("base_price") or profile["base_price"]

        #No that all validation is done hand it to or LCG gen
        raw_data = temp_lcg.generate_market_history(symbol, interval, start_date, count, base_price)
        return [MockOHLCV(**row) for row in raw_data]

    @staticmethod
    def get_status() -> EpicStatusDTO:
        return EpicStatusDTO(
            epic="market_data",
            status="scaffolded",
        )

    @staticmethod
    def get_mock_ticker_data() -> List[MockOHLCV]:
        return [MockOHLCV(**data) for data in PlaceholderTicker]

    def get_asset_prices_data(self, ticker: str, req: MarketHistoryReq) -> List[MockOHLCV]:

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
        if req.interval and req.interval not in allowed_intervals:
                raise HTTPException(status_code=422, detail="Invalid time")

        req.symbol = FormattedSymbol

        RawData = self.generate_history(req)
        return RawData

    def get_asset_summary_data(self, ticker: str) -> AssetSummary:

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

        # Pyright now knows this is a MockOHLCV object, allowing attribute access safely
        NewBar = DailyHistory[-1]

        return AssetSummary(
            ticker=FormattedSymbol,
            current_price=NewBar.close,
            daily_high=NewBar.high,
            daily_low=NewBar.low,
            timestamp=NewBar.timestamp
        )