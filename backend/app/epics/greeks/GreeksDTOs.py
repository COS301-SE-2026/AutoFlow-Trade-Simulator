
from datetime import datetime
from decimal import Decimal

from sqlmodel import  SQLModel, Field
from enum import Enum


class EpicStatusDTO(SQLModel):
    epic: str
    status: str

# New model to handle the new dynamic calculations
class CalculateGreeksRequest(SQLModel):
    current_price: float = Field(gt=0, description="current underlying asset price")
    strike_price: float = Field(gt=0, description="strike price")
    time_to_expire: float = Field(gt=0, description="Time to expiration in years (e.g. 30 days = 30/365)")
    interest_rate: float = Field(description="Risk free intest rate as a decimal (e.g. 0.20 for 20% , .30 for 30%) ")
    sigma: float = Field(description="Implied volatility as a decimal (e.g. 0.20 for 20% , .30 for 30%) ")
    option_type: str = Field("call", regex="^(call|put)$", description="'call' or 'put'")

class GreekValues(SQLModel):
    delta: float
    gamma: float
    theta: float
    vega: float
    rho: float


class HistPriceHistoryItem(SQLModel):
    asset_id: int
    symbol: str
    volume: Decimal
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

class TimePeriod(Enum):
    ONE_DAY = "1d"
    ONE_WEEK = "1w"
    ONE_MONTH = "1m"
    THREE_MONTHS = "3m"
    SIX_MONTHS = "6m"
    ONE_YEAR = "1y"
    FIVE_YEARS = "5y"
