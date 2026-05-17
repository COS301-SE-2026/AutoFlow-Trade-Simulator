from pydantic import BaseModel


class MockOHLCV(BaseModel):
    timestamp: str
    symbol: str
    interval: str
    open: float
    high: float
    low: float
    close: float
    volume: float
