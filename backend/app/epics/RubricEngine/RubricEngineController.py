from typing import Annotated
from fastapi import APIRouter, Depends, status
from sqlmodel import Session

from ...database import get_session
from ...core.security import get_current_user
from ...models import User

from .RubricEngineDTO import EpicStatusDTO, CategoryScoreDTO, ExecutionMetricDTO, EvaluationResultDTO
from .RubricEngineService import RubricEngineService

UserDep = Annotated[User, Depends(get_current_user)]

def get_rubric_service(session: Session = Depends(get_session)) -> RubricEngineService:
    return RubricEngineService(session)

ServiceDep = Annotated[RubricEngineService, Depends(get_rubric_service)]

router = APIRouter(prefix="/rubric", tags=["Rubric Engine"])

@router.get("/status", status_code=status.HTTP_200_OK)
def health_check(service: ServiceDep) -> EpicStatusDTO:
    return service.get_status()

@router.post("/evaluate/{strat_key}", status_code=status.HTTP_200_OK)
def evaluate_strategy(strat_key: str, metrics: ExecutionMetricDTO, service: ServiceDep, current_user: UserDep) -> EvaluationResultDTO:
    return service.evaluate_strategy(strat_key=strat_key, metrics=metrics)