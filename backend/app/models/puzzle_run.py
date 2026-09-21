from datetime import date, datetime
from decimal import Decimal
from typing import Dict, List, Optional

from sqlalchemy.dialects.postgresql import JSONB
from sqlmodel import Column, Field, JSON, SQLModel

JSONVariant = JSONB().with_variant(JSON, "sqlite")


class PuzzleRun(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", index=True)
    strategy_id: int = Field(foreign_key="strategies.strat_id")
    symbol: str = Field(max_length=20)
    start_date: date
    end_date: date
    seed: int
    initial_balance: Decimal = Field(max_digits=18, decimal_places=4)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    actions: List[Dict] = Field(default_factory=list, sa_column=Column(JSONVariant))
    final_balance: Optional[Decimal] = Field(default=None, max_digits=18, decimal_places=4)
    rubric_score: Optional[int] = Field(default=None)
    completed_at: Optional[datetime] = Field(default=None)
