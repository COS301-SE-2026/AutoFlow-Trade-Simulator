from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlmodel import Session

from ...database import get_session
from .GreeksDTOs import EpicStatusDTO, GreekValues, HistPriceHistoryResponse, MarketConditionResponse, TimePeriod
from .GreeksService import GreeksService
router = APIRouter(prefix="/greeks",tags=["Greeks"])




def get_greeks_service(session: Annotated[Session, Depends(get_session)]) -> GreeksService:
    return GreeksService(session)

@router.get("/status")
def get_epic_status() -> EpicStatusDTO:
    return GreeksService.get_status()

@router.get("/market-condition")
def get_market_condition(
    service: Annotated[GreeksService, Depends(get_greeks_service)],
) -> MarketConditionResponse:
    return service.get_market_condition()


@router.get("/{symbol}")
def get_greeks(
    symbol: str,
    service: Annotated[GreeksService, Depends(get_greeks_service)],
) -> GreekValues:
    return service.get_greeks(symbol)


@router.get("/{symbol}/history")
def get_greeks_history(
    symbol: str,
    service: Annotated[GreeksService, Depends(get_greeks_service)],
    period: Annotated[TimePeriod, Query(description="The time period for the historical data")],
) -> HistPriceHistoryResponse:
    return service.get_history(symbol, period)