from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlmodel import Session
from ...core.security import get_current_user
from ...models.user import User
from ...database import get_session
from .GreeksDTOs import EpicStatusDTO, GreekValues, HistPriceHistoryResponse, MarketConditionResponse, TimePeriod, CalculateGreeksRequest
from .GreeksService import GreeksService
router = APIRouter(prefix="/greeks",tags=["Greeks"])


def get_greeks_service(session: Annotated[Session, Depends(get_session)]) -> GreeksService:
    return GreeksService(session)

@router.get("/status")
def get_epic_status() -> EpicStatusDTO:
    return GreeksService.get_status()

@router.get("/market-condition")
def get_market_condition(
    service: Annotated[GreeksService, Depends(get_greeks_service)],user: Annotated[User, Depends(get_current_user)]
) -> MarketConditionResponse:
    return service.get_market_condition()


@router.get("/{symbol}")
def get_greeks(
    symbol: str,
    service: Annotated[GreeksService, Depends(get_greeks_service)],user: Annotated[User, Depends(get_current_user)]
) -> GreekValues:
    return service.get_greeks(symbol)


@router.get("/{symbol}/history")
def get_greeks_history(
    symbol: str,
    service: Annotated[GreeksService, Depends(get_greeks_service)],user: Annotated[User, Depends(get_current_user)],
    period: Annotated[TimePeriod, Query(description="The time period for the historical data")],
) -> HistPriceHistoryResponse:
    return service.get_history(symbol, period)

@router.post("/calculate", response_model=GreekValues)
def calculate_greeks (
    req: CalculateGreeksRequest, 
    service: Annotated[GreeksService, 
    Depends(get_greeks_service)], 
    user: Annotated[User, Depends(get_current_user)]
) -> GreekValues:
    return service.calc_greeks(
        current_price = req.current_price,
        strike_price = req.strike_price,
        time_to_expire = req.time_to_expire,
        interest_rate = req.interest_rate,
        sigma = req.sigma,
        option_type = req.option_type
    )