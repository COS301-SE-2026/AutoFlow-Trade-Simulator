from sqlmodel import Field, SQLModel
from datetime import datetime
from enum import Enum
from decimal import Decimal

class option_type(Enum):
    CALL = "CALL"
    PUT = "PUT"

class options(SQLModel, table=True):
    asset_id: int = Field(primary_key=True, foreign_key="asset.asset_id", ondelete="CASCADE")
    option_type: option_type = Field(nullable=False)
    strike_price: Decimal = Field(max_digits=18, decimal_places=4, nullable=False)
    expr_date: datetime = Field(nullable=False)
    bid: Decimal = Field(max_digits=18, decimal_places=4, nullable=False)
    last_price: Decimal = Field(max_digits=18, decimal_places=4, nullable=False)
    volume: Decimal = Field(max_digits=18, decimal_places=4, nullable=False)
    open_intrest: Decimal = Field(max_digits=18, decimal_places=4, nullable=False)
    imp_vol: Decimal = Field(default=None, max_digits=18, decimal_places=4, nullable=True)
    timestamp: datetime = Field(default=None, nullable=True)
    in_the_money: bool = Field(default=False)