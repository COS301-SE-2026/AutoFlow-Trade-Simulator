from datetime import datetime, timedelta
from typing import Optional
from decimal import Decimal
from sqlmodel import Field, SQLModel

class MarketDataCache(SQLModel, talbe=True):
    asset_id: int = Field(foreign_key="asset.id", primary_key=True)

    #Market data common terms
    last_price: Decimal = Field(max_digits=18, decimal_places=4, nullable=False)
    bid_price: Decimal = Field(max_digits=18, decimal_places=4, nullable=False)
    ask_price: Decimal = Field(max_digits=18, decimal_places=4, nullable=False)
    bid_size: int = Field(nullable=False)
    ask_size: int = Field(nullable=False)
    total_volume: int = Field(nullable=False)
    open_price: Decimal = Field(max_digits=18, decimal_places=4, nullable=False)
    high_price: Decimal = Field(max_digits=18, decimal_places=4, nullable=False)
    low_price: Decimal = Field(max_digits=18, decimal_places=4, nullable=False)
    official_close: Optional[Decimal] = Field(default=None, max_digits=18, decimal_plaaces=4)
    trading_status: str = Field(default="Trading", nullable=False)
    exchange_timestamp: datetime = Field(nullable=False)
    updated_at: datetime = Field(nullable=False)
    expires_at: datetime = Field(index=True, nullable=False)