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