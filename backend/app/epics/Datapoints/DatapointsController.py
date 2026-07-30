from fastapi import APIRouter, Depends, status
from sqlmodel import Session

from typing import Annotated, List
from .DatapointsService import DatapointsService
from .DatapointsDTO import DataPoint, QueryParameters, IntervalParameters, EpicStatusDTO
from ...database import get_session
from ...core.security import get_current_user
from ...models import User


QueryDep = Annotated[QueryParameters, Depends()]
PredefDep = Annotated[IntervalParameters, Depends()]
UserDep = Annotated[User, Depends(get_current_user)]

router = APIRouter(prefix="/assets", tags=["Charts"])

def get_datapoints_service(session: Session = Depends(get_session)) -> DatapointsService:
    return DatapointsService(session)

ServiceDep = Annotated[DatapointsService, Depends(get_datapoints_service)]
#Nvm I can pass session should really read code a little slower

@router.get("/status", status_code=status.HTTP_200_OK)
def health_check(service: ServiceDep) -> EpicStatusDTO:
    return service.get_status()

@router.get("/{asset_id}/chart_custom")
def get_custom_chart(asset_id: int, params: QueryDep, service: ServiceDep, current_user: UserDep)-> List[DataPoint]:
    return service.sampled_ohlcv(asset_id=asset_id, params=params)

@router.get("/{asset_id}/chart_predef")
def get_predef_chart(asset_id: int, params: PredefDep, service: ServiceDep, current_user: UserDep)-> List[DataPoint]:
    return service.predef_ohlcv(asset_id=asset_id, params=params)