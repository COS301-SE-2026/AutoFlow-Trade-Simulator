from typing import Optional
from sqlmodel import Field, SQLModel 


class Portfolio(SQLModel,table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(default=None,foreign_key="user.id")
    cash_balance: float = Field(default=0)
