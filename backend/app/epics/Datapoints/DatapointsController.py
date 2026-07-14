from fastapi import APIRouter, Depends, Query
from sqlmodel import Session
from typing import List

from .DatapointsService import sampled_ohlcv
from .DatapointsDTO import QueryParameters, DataPoint

router = APIRouter(prefix="/assets", tags=["Charts"])

#I cant pass session around to much headache saw a cool way to test using it by means of mocking the db
#After some consideration not worth it...

@router.get("/{asset_id}/chart")
def get_asset_chart(sesion: Session, asset_id: int, params: QueryParameters = Depends()):
    return sampled_ohlcv(sesion: Session, asset_id=asset_id, params=params)