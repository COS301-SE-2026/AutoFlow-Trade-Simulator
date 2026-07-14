from fastapi import APIRouter, Depends
from sqlmodel import Session

from .DatapointsService import sampled_ohlcv
from .DatapointsDTO import QueryParameters
from ...database import get_session

SessionDep = Annoted[Session, Depends(get_session)]
QueryDep = Annoted[QueryParameters, Depends()]

router = APIRouter(prefix="/assets", tags=["Charts"])

#Nvm I can pass session should really read code a little slower

@router.get("/{asset_id}/chart")
def get_asset_chart(asset_id: int, params: QueryDep, session: SessionDep):
    return sampled_ohlcv(session=session, asset_id=asset_id, params=params)