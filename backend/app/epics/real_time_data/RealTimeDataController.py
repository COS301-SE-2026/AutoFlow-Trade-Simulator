from fastapi import APIRouter
from typing import Annotated
from sqlmodel import Session
from fastapi import Depends
from ...database import get_session
from .RealTimeDataService import RealTimeDataService
from .RealTimeDataDTOs import DataResponseDTO, EpicStatusDTO, MoversResponseDTO, SymbolResponseDTO
router = APIRouter(prefix="/real_time",tags=["Real Time Data"])

def get_real_time_service(session: Annotated[Session, Depends(get_session)]) -> RealTimeDataService:
    return RealTimeDataService(session)

@router.get("/status")
def get_status(service: Annotated[RealTimeDataService, Depends(get_real_time_service)])->EpicStatusDTO:
    return service.get_status()

@router.get("/points/{symbol}")
def get_real_data(symbol:str,service: Annotated[RealTimeDataService, Depends(get_real_time_service)])->DataResponseDTO:
    return service.get_real_time_data(symbol)


@router.get("/list")
def get_symbol_list(service: Annotated[RealTimeDataService, Depends(get_real_time_service)])->SymbolResponseDTO:
    return service.get_symbol_list()

@router.get("/movers")
def get_top_movers(service: Annotated[RealTimeDataService, Depends(get_real_time_service)],limit:int=10)->MoversResponseDTO:
    return service.get_top_movers(limit)
