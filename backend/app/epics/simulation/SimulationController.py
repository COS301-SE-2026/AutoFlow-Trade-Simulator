from typing import Annotated
from fastapi import APIRouter,Depends
from sqlalchemy.orm import session
from sqlmodel import Session
from .SimulationService import SimulationService
from ...database import get_session
from .SimulationDTOs import EpicStatusDTO, StrategiesResponse


router = APIRouter(prefix="/simulation",tags=["Simulation"])

def get_simulation_service(session: Annotated[Session, Depends(get_session)]) -> SimulationService:
    return SimulationService(session)


@router.get("/status")
def get_epic_status() -> EpicStatusDTO:
    return SimulationService.get_status()

@router.get("/strategies")
def get_strategies(service:Annotated[SimulationService, Depends(get_simulation_service)])->StrategiesResponse:
    return service.get_strategies()
