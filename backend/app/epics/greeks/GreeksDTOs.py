
from datetime import datetime
from decimal import Decimal

from sqlmodel import SQLModel


class EpicStatusDTO(SQLModel):
    epic: str
    status: str

class GreekValues(SQLModel):
    delta: float
    gamma: float
    theta: float
    vega: float
    rho: float


class HistPriceHistoryItem(SQLModel):
    asset_id: int
    symbol: str
    volume: int
    open_price: Decimal
    high_price: Decimal
    low_price: Decimal
    official_close: Decimal | None
    timestamp: datetime


class HistPriceHistoryResponse(SQLModel):
    symbol: str
    history: list[HistPriceHistoryItem]

class MarketConditionResponse(SQLModel):
    market_condition: str
