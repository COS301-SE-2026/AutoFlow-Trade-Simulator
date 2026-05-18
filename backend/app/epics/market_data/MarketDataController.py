from fastapi import APIRouter, Query, Depends
from typing import List

from .MarketDataDTOs import EpicStatusDTO, MockOHLCV, AssetSummary
from .MarketDataService import MarketDataService

router = APIRouter(prefix="/market-data", tags=["Market Data"])


@router.get("/status", response_model=EpicStatusDTO)
def get_epic_status() -> EpicStatusDTO:
    return MarketDataService.get_status()

@router.get("/assets", response_model=List[MockOHLCV])
def get_mock_tickers():
    return MarketDataService.get_mock_ticker_data()

@router.get("/assets/{ticker}/prices", response_model=List[MockOHLCV])
def get_asset_prices(ticker: str, timeframe: str = Query(...), service: MarketDataService = Depends()):
    return MarketDataService.get_asset_prices_data(ticker, timeframe)

@router.get("/assets/{ticker}/summary", response_model=AssetSummary)
def get_asset_summary(ticker: str, service: MarketDataService = Depends()):
    return MarketDataService.get_asset_summary_data(ticker)
