from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

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