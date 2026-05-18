from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from sqlmodel SQLModel


class MockOHLCV(SQLModel):
    timestamp: str
    symbol: str
    interval: str
    open: float
    high: float
    low: float
    close: float
    volume: float

class MarketHistoryReq(SQLModel):
    symbol: Optional[str] = None
    interval: Optional[str] = None
    start_date: Optional[datetime] = None
    count: Optional[int] = None
    base_price: Optional[float] = None

class EpicStatusDTO(SQLModel):
    epic: str
    status: str