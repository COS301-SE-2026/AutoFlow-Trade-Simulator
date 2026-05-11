from pydantic import BaseModel


class EpicStatusDTO(BaseModel):
    timestamp: str
    symbol: str
    iterval: str
    open: float
    high: float
    low: float
    close: float
    volume: float
