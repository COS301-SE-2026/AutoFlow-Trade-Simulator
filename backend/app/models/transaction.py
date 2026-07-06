from datetime import datetime,timezone
from decimal import Decimal
from enum import Enum
from typing import Optional
from sqlmodel import Field, SQLModel

class Direction(Enum):
    Sell="sell"
    Buy="buy"

class Transaction(SQLModel,table=True):
    id:Optional[int] = Field(default=None,primary_key=True)
    account_id:int =Field(default=None,foreign_key="internationalaccount.id",index=True)
    asset_id: int =Field(default=None,foreign_key="asset.asset_id")
    direction:Direction = Field(default=None)
    quantity:float =Field(default=None)
    price_at_execution: Decimal = Field(default=None)
    executed_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc),index=True)



