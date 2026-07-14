from datetime import datetime, timedelta
from typing import List
from sqlalchemy import text
from sqlmodel import Session

from .DatapointsDTO import DataPoint, QueryParameters

def sampled_ohlcv( session: Session, asset_id: int, params: QueryParameters) -> List[CandleDataPoint]:

    timeframe_mapping = {
        "1 month": timedelta(days=30),
        "1 year": timedelta(days=365),
        "5 years": timedelta(days=365 * 5),
    }

    #A little code to stop a minor error such as not sending the correct interval
    duration = timeframe_mapping.get(params.timeframe, timeframe_mapping["1 month"])