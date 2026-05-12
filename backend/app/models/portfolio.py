from decimal import Decimal
from typing import Optional
from sqlmodel import Field, SQLModel 


class Portfolio(SQLModel,table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(default=None,foreign_key="user.id")
    cash_balance: Decimal = Field(default=0)
    name:str =Field(default=None)
