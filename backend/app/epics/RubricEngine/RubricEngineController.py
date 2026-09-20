from typing import Annotated
from fastapi import APIRouter, Depends, status
from sqlmodel import Session

from ...database import get_session
from ...core.security import get_current_user
from ...models import User

from .RubricDTO import EpicStatusDTO, CategoryScoreDTO, ExecutionMetricDTO, EvaluationResultDTO
from .RubricEngineService import RubricEngineService

UserDep = Annotated[User, Depends(get_current_user)]

def get_rubric_services(session: Session = Depends(get_session)) -> RubricEngineService: 
    return RubricEngineService(session)

RubricServiceDep = Annotated[RubricEngineService, Depends(get_rubric_services)]

router = APIRouter(prefix="/rubric", tags=["Rubric Engine"])

@router.get("/status", status_code=status.HTTP_200_OK)
def health_check(service: ServiceDep) -> EpicStatusDTO:
    return service.get_status()



