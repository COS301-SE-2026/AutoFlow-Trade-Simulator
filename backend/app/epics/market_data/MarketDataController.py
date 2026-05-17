from fastapi import APIRouter

from .MarketDataDTOs import MockOHLCV
from .MarketDataService import MarketDataService

router = APIRouter(prefix="/market-data", tags=["Market Data"])


@router.get("/status", response_model=EpicStatusDTO)
def get_epic_status() -> EpicStatusDTO:
    return MarketDataService.get_status()
