from sqlmodel import Field, SQLModel
from datetime import datetime, date
from enum import Enum
from decimal import Decimal

class OptionType(Enum):
    CALL = "CALL"
    PUT = "PUT"

class Options(SQLModel, table=True):
    contract_symbol: str = Field(max_length=32, primary_key=True)
    timestamp: datetime = Field(primary_key=True)
    asset_id: int = Field(foreign_key="asset.asset_id", ondelete="CASCADE", index=True, nullable=False)
    option_type: OptionType = Field(nullable=False)
    strike_price: Decimal = Field(max_digits=18, decimal_places=4, nullable=False)
    expr_date: date = Field(nullable=False)
    bid: Decimal = Field(max_digits=18, decimal_places=4, nullable=True)
    ask: Decimal = Field(max_digits=18, decimal_places=4, nullable=True)
    last_price: Decimal = Field(max_digits=18, decimal_places=4, nullable=True)
    volume: Decimal = Field(max_digits=18, decimal_places=4, nullable=True)
    open_interest: Decimal = Field(max_digits=18, decimal_places=4, nullable=True)
    imp_vol: Decimal = Field(default=None, max_digits=18, decimal_places=4, nullable=True)
    in_the_money: bool = Field(default=False)