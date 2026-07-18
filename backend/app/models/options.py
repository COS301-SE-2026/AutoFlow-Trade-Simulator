from sqlmodel import Field, SQLModel
from datetime import datetime
from enum import Enum
from decimal import Decimal

class option_type(Enum):
    CALL = "CALL"
    PUT = "PUT"

class options(SQLModel, table=True):
    asset_id: int = Field(primary_key=True, foreign_key="asset.asset_id")
    option_type: option_type = Field(nullable=False)
    strike_price: Decimal = Field(max_digits=18, decimal_places=4, nullable=False)
    expr_date: datetime = Field(nullable=False)
    exercise_style: str = Field(default="None", max_length=20, nullable=False)