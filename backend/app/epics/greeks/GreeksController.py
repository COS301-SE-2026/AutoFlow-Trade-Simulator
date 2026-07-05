from fastapi import APIRouter, Depends
from sqlmodel import Session

from ...database import get_session
from .GreeksDTOs import EpicStatusDTO, HistPriceHistoryResponse, GreekValues, MarketConditionResponse
from .GreeksService import GreeksService
router= APIRouter(prefix="/greeks",tags=["Greeks"])


def get_greeks_service(session: Session = Depends(get_session)) -> GreeksService:
    return GreeksService(session)

@router.get("/status", response_model=EpicStatusDTO)
def get_epic_status() -> EpicStatusDTO:
    return GreeksService.get_status()


@router.get("/{symbol}", response_model=GreekValues)
def get_greeks(symbol: str, service: GreeksService = Depends(get_greeks_service)) -> GreekValues:
    return service.get_greeks(symbol)


@router.get("/{symbol}/history", response_model=HistPriceHistoryResponse)
def get_greeks_history(symbol: str, service: GreeksService = Depends(get_greeks_service)) -> HistPriceHistoryResponse:
    return service.get_history(symbol)

@router.get("/market-condition", response_model=MarketConditionResponse)
def get_market_condition(service: GreeksService = Depends(get_greeks_service)) -> MarketConditionResponse:
    return service.get_market_condition()