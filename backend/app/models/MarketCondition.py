from sqlmodel import Field, SQLModel
from datetime import datetime
from enum import Enum

class Condition(Enum)
    BULL = "BULL"
    BEAR = "BEAR"
    RANGING = "RANGING"

class MarketCondition(SQLModel, table=True):
    id: int = Field(default=None, primary_key=True)
    asset_id: int = Field(foreign_key="asset.id")
    date: datetime = Field(nullable=False)
    condition:Condition = Field(nullable=False)
