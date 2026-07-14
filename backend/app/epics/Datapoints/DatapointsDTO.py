from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

#validate the json body we are getting feels ood not coding a validator for this stuff...
class QueryParameters(BaseModel):
    timeframe: str = Field(
        default="1 month",
        description="Timeframe to fetch: '1 month', '1 year', '5 years', etc... "
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