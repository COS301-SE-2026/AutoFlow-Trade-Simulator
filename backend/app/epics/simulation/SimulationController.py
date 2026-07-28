from typing import Annotated
from fastapi import APIRouter,Depends, HTTPException
from sqlmodel import Session

from ...core.security import get_current_user
from ...models.user import User
from .SimulationService import SimulationService
from ...database import get_session
from .SimulationDTOs import EpicStatusDTO, SimulationAppendRequest, SimulationFinishResponse, SimulationSessionResponse, StrategiesResponse,SimulationCreateRequest, StrategyDetail

auth_error="User not authenticated"
router = APIRouter(prefix="/simulation",tags=["Simulation"])

def get_simulation_service(session: Annotated[Session, Depends(get_session)]) -> SimulationService:
    return SimulationService(session)


@router.get("/status")
def get_epic_status() -> EpicStatusDTO:
    return SimulationService.get_status()

@router.get("/strategies")
def get_strategies(service:Annotated[SimulationService, Depends(get_simulation_service)])->StrategiesResponse:
    return service.get_strategies()
@router.get("/strategies/{strategy_id}")
def get_strategy_detail(strategy_id:int,service:Annotated[SimulationService, Depends(get_simulation_service)],current_user:Annotated[User,Depends(get_current_user)])->StrategyDetail:
    return service.get_strategy_detail(strategy_id)
@router.post(
    "/practice/simulate",
    responses={
        401: {"description":auth_error},
    }
)
def create_practice_simulation(req:SimulationCreateRequest,service:Annotated[SimulationService, Depends(get_simulation_service)],current_user:Annotated[User,Depends(get_current_user)])->SimulationSessionResponse:
    if current_user.id is None:
        raise HTTPException(status_code=401, detail="User not authenticated")
    return service.create_simulation_session(req,current_user.id)

@router.post(
    "/practice/simulate/actions",
    responses={
        401: {"description": auth_error},
    }
)
def append_simulation_actions(req:SimulationAppendRequest,service:Annotated[SimulationService, Depends(get_simulation_service)],current_user:Annotated[User,Depends(get_current_user)])->SimulationSessionResponse:
    if current_user.id is None:
        raise HTTPException(status_code=401, detail=auth_error)
    return service.append_simulation_actions(req,current_user.id)

@router.post(
    "/practice/simulate/{simulation_id}/finish",
    responses={
        401: {"description": "User not authenticated"},
    }
)
def finalize_practice_simulation(simulation_id:int,service:Annotated[SimulationService, Depends(get_simulation_service)],current_user:Annotated[User,Depends(get_current_user)])->SimulationFinishResponse:
    if current_user.id is None:
        raise HTTPException(status_code=401, detail=auth_error)
    return service.finalize_simulation(simulation_id,current_user.id)
