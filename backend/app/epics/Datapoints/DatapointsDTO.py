from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field

class QueryParameters(BaseModel):
    timeframe: str = Field(
        default="1month",
        description="Timeframe to fetch: '1 month', '1 year', '5 years', etc... "
    )
    data_points: int = Field(
        default=20,
        gt=0,
        le=500,
        description="Number of data points desired for graph"
    )