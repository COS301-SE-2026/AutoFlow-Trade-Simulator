from datetime import datetime, timedelta, UTC
from typing import List
from sqlalchemy import text
from sqlmodel import Session
from fastapi import HTTPException

from .DatapointsDTO import DataPoint, QueryParameters, IntervalParameters

def predef_ohlcv(session: Session, asset_id: int, params: QueryParameters) -> List[DataPoint]:


def sampled_ohlcv(session: Session, asset_id: int, params: QueryParameters) -> List[DataPoint]:


    end_time = params.end_date or datetime.now(UTC)

    start_time = params.start_date or (end_time - timedelta(days=30))
    

    #Calculations to help get the desired data points
    total_duration = (end_time - start_time).total_seconds()

    #Its already in seconds might as well do it like this
    if total_duration < 0:
        raise HTTPException(status_code=400, detail="start date greater than end date")

    bucket_seconds = max(int(total_duration / params.data_points), 1)
    bucket_interval = f"{bucket_seconds} seconds"

    #Query to get all desired data alias the names so their a bit more descriptive
    if total_duration > 86400:
        query = text("""
            SELECT 
                time_bucket(:bucket_interval, bucket_time) AS bucket_time, 
                first(open, bucket_time) AS open_price, 
                max(high) AS high_price, 
                min(low) AS low_price, 
                last(close, bucket_time) AS close_price, 
                sum(volume) AS total_volume
            FROM ohlcv_1h
            WHERE asset_id = :asset_id 
                AND bucket_time >= :start_time 
                AND bucket_time <= :end_time
            GROUP BY bucket_time
            ORDER BY bucket_time ASC
        """)

        query_params = {"bucket_interval": bucket_interval, "asset_id": asset_id, "start_time": start_time, "end_time": end_time}
    else:
        query = text("""
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
                AND "timestamp" <= :end_time
            GROUP BY bucket_time
            ORDER BY bucket_time ASC;
        """)

        query_params = {"bucket_interval": bucket_interval, "asset_id": asset_id,"start_time": start_time,"end_time": end_time}

    result = session.execute(query, query_params)

    #loop through the raw rows returned by the db making a List of Datapoint then we return the data
    return [
        DataPoint(
            time=row.bucket_time,
            open=round(float(row.open_price), 4) if row.open_price else None,
            high=round(float(row.high_price), 4) if row.high_price else None,
            low=round(float(row.low_price), 4) if row.low_price else None,
            close=round(float(row.close_price), 4) if row.close_price else None,
            volume=round(float(row.total_volume), 4) if row.total_volume is not None else 0.0,
        )
        for row in result
    ]