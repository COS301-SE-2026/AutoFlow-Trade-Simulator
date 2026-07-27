from fastapi import APIRouter, Query, Depends
from typing import List, Annotated

from .MarketDataDTOs import EpicStatusDTO, MockOHLCV, AssetSummary, MarketHistoryReq
from .MarketDataService import MarketDataService

router = APIRouter(prefix="/market-data", tags=["Market Data"])


@router.get("/status", response_model=EpicStatusDTO)
def get_epic_status() -> EpicStatusDTO:
    return MarketDataService.get_status()

#Mock data that is static
@router.get("/assets", response_model=List[MockOHLCV])
def get_mock_tickers() -> List[MockOHLCV]:
    return MarketDataService.get_mock_ticker_data()

#Generated data
@router.get("/assets/{ticker:path}/prices", response_model=List[MockOHLCV])
def get_asset_prices(ticker: str, req: Annotated[MarketHistoryReq, Depends()], service: Annotated[MarketDataService , Depends()]) -> List[MockOHLCV]:
    return service.get_asset_prices_data(ticker=ticker, req=req)

#Latest daily aggregate
@router.get("/assets/{ticker:path}/summary", response_model=AssetSummary)
def get_asset_summary(ticker: str, service: Annotated[MarketDataService , Depends()]) -> AssetSummary:
    return service.get_asset_summary_data(ticker)
