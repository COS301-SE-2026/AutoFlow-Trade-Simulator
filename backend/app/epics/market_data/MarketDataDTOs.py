from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class MockOHLCV(BaseModel):
    timestamp: str
    symbol: str
    interval: str
    open: float
    high: float
    low: float
    close: float
    volume: float

class MarketHistoryReq(BaseModel):
    symbol: Optional[str] = None
    interval: Optional[str] = None
    start_date: Optional[datetime] = None
    count: Optional[int] = None
    base_price: Optional[float] = None