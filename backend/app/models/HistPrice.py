from sqlmodel import Field, SQLModel
from decimal import Decimal
from datetime import datetime
from typing import Optional

class HistPrice(SQLModel, table=True):
    asset_id: int = Field(default=None, primary_key=True, foreign_key="asset.id")
    volume: int = Field(nullable=False)
    open_price: Decimal = Field(max_digits=18, decimal_places=4, nullable=False)
    high_price: Decimal = Field(max_digits=18, decimal_places=4, nullable=False)
    low_price: Decimal = Field(max_digits=18, decimal_places=4, nullable=False)
    symbol: str = Field(nullable=False)
    offical_close: Optional[Decimal] = Field(default=None, nullable=True)
    date: datetime = Field(nullable=False)