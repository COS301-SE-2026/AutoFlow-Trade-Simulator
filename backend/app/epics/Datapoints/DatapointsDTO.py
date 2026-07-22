from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from enum import Enum

#validate the json body we are getting feels ood not coding a validator for this stuff...
class QueryParameters(BaseModel):
    start_date: Optional[datetime] = Field(
        None,
        description="Start date (YYYY-MM-DD). If omitted, defaults to 30 days ago. (ex 2026-01-01)"
    )
    end_date: Optional[datetime] = Field(
        None,
        description="End date (YYYY-MM-DD). If omitted, defaults to current time. (ex 2026-06-01)"
    )
    data_points: int = Field(
        default=20,
        gt=0,
        le=500,
        description="Number of data points desired for graph"
    )

class Interval(str, Enum):
    H1 = "1h"
    D1 = "1d"
    W1 = "1w"
    M1 = "1m"
    M6 = "6m"
    Y1 = "1y"

class IntervalParameters(BaseModel):
    interval: Interval = Field(
        default=Interval.H1,
        description="Please send an interval 1h, 1d, 1w, 1m, 6m, 1y"
    )

#DTO to return stuffs
class DataPoint(BaseModel):
    time: datetime
    open: Optional[float] = None
    high: Optional[float] = None
    low: Optional[float] = None
    close: Optional[float] = None
    volume: float = 0.0

#Allows for the db fields to be changed into smth python will understand
    class Config:
        from_attributes = True