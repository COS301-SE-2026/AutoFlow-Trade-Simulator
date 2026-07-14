from fastapi import APIRouter, Depends, Query
from sqlmodel import Session
from typing import List

from .DatapointsService import sampled_ohlcv
from .DatapointsDTO import QueryParameters, DataPoint

router = APIRouter(prefix="/assets", tags=["Charts"])

#Nvm I can pass session should really read code a little slower

@router.get("/{asset_id}/chart")
def get_asset_chart(session: Session = Depends(get_session), asset_id: int, params: QueryParameters = Depends()):
    return sampled_ohlcv(session=session, asset_id=asset_id, params=params)