from fastapi import APIRouter, Depends, Query
from sqlmodel import Session
from typing import List

from DatapointsService import sampled_ohlcv
from DatapointsDTO import QueryParameters, DataPoint

router = APIRouter(prefix"/assets", tags=["Charts"])

@router.get("/{asset_id}/chart")
    def get_asset_chart( asset_id: int, params: QueryParameters = Depends()):
        return sampled_ohlcv(asset_id=asset_id, params=params)