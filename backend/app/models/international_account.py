from datetime import datetime, timezone
from typing import Optional
from sqlalchemy.orm import foreign
from sqlmodel import SQLModel,Field


class InternationalAccount(SQLModel,table=True):
    id: Optional[int]= Field(default=None, primary_key=True)
    user_id:int = Field(default=None, foreign_key="user.id")
    currency_id:int =Field(default=None,foreign_key="currency.id")
    balance:float =Field(default=0)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


