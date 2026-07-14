from datetime import datetime, timedelta
from typing import List
from sqlalchemy import text
from sqlmodel import Session

from .DatapointsDTO import DataPoint, QueryParameters

def sampled_ohlcv(asset_id: int, params: QueryParameters) -> List[DataPoint]:

    timeframe_mapping = {
        "1 month": timedelta(days=30),
        "1 year": timedelta(days=365),
        "5 years": timedelta(days=365 * 5),
    }

    #A little code to stop a minor error such as not sending the correct interval
    duration = timeframe_mapping.get(params.timeframe, timeframe_mapping["1 month"])

    #Calculations to help get the desired data points
    total_seconds = duration.total_seconds()
    bucket_seconds = int(total_seconds / params.data_points)
    bucket_interval = f"{bucket_seconds} seconds"

    start_time = datetime.utcnow() - duration

    #Query to get all desired data alias the names so their a bit more descriptive
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

    with Session() as session:
        result = session.execute(
            query,
            {
                "bucket_interval": bucket_interval,
                "asset_id": asset_id,
                "start_time": start_time
            }
        )

    #loop through the raw rows returned by the db making a List of Datapoint then we return the data
    return [
        DataPoint(
            time=row.bucket_time,
            open=round(float(row.open_price), 4) if row.open_price else None,
            high=round(float(row.high_price), 4) if row.high_price else None,
            low=round(float(row.low_price), 4) if row.low_price else None,
            close=round(float(row.close_price), 4) if row.close_price else None,
            volume=round(float(row.total_volume), 4) if row.total_volume else None,
        )
        for row in result
    ]