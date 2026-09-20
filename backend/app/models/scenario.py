from datetime import date
from typing import Optional

from sqlmodel import Field, SQLModel


class Scenario(SQLModel, table=True):
    id: int = Field(default=None, primary_key=True)
    name: str = Field(max_length=100)
    description: Optional[str] = Field(default=None)
    symbol: str = Field(max_length=20)
    start_date: date
    end_date: date
    active: bool = Field(default=True)
