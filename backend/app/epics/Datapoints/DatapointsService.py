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

    total_seconds = duration.total_seconds()
    bucket_seconds = int(total_seconds / params.data_points)
    bucket_interval = f"{bucket_seconds} seconds"

    start_time = datetime.utcnow() - duration

    query = text(""
        SELECT
            time_bucket(:bucket_interval, "timestamp") AS bucket_time,
            first(open, "timestamp") AS open_price,
            max(high) AS high_price,
            min(low) AS low_price,
            last(close, "timestamp") AS close_price,
            sum(volume) AS total_volume
        FROM dailyohlcv
        Where asset_id = :asset_id
            AND "timestamp" >= :start_time
        GROUP BY bucket_time
        ORDER BY bucket_time ASC;
    "")