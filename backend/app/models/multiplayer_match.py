from datetime import date, datetime
from decimal import Decimal
from enum import Enum
from typing import Dict, List, Optional

from sqlalchemy.dialects.postgresql import JSONB
from sqlmodel import Column, Field, JSON, SQLModel

JSONVariant = JSONB().with_variant(JSON, "sqlite")

USER_PK = "user.id"


class MatchStatus(str, Enum):
    in_progress = "in_progress"
    completed = "completed"
    abandoned = "abandoned"


class QuestionType(str, Enum):
    jargon = "jargon"
    scenario = "scenario"


class MultiplayerMatch(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    scenario_id: int = Field(foreign_key="scenario.id")
    symbol: str = Field(max_length=20)
    start_date: date
    end_date: date
    initial_balance: Decimal = Field(max_digits=18, decimal_places=4)
    perturbation_seed: int
    perturbation_version: str = Field(default="v1", max_length=10)
    data_snapshot_id: str = Field(default="demo", max_length=50)
    status: MatchStatus = Field(default=MatchStatus.in_progress, max_length=15)
    player_one_id: int = Field(foreign_key=USER_PK)
    player_two_id: int = Field(foreign_key=USER_PK)
    winner_user_id: Optional[int] = Field(default=None, foreign_key=USER_PK)
    current_day_index: int = Field(default=0)
    started_at: datetime = Field(default_factory=datetime.utcnow)
    ended_at: Optional[datetime] = Field(default=None)


class MultiplayerParticipant(SQLModel, table=True):
    match_id: int = Field(foreign_key="multiplayermatch.id", primary_key=True)
    user_id: int = Field(foreign_key=USER_PK, primary_key=True)
    cash_balance: Decimal = Field(max_digits=18, decimal_places=4)
    position_qty: Decimal = Field(default=Decimal("0"), max_digits=18, decimal_places=4)
    disconnected_at: Optional[datetime] = Field(default=None)


class MatchEventLog(SQLModel, table=True):
    match_id: int = Field(foreign_key="multiplayermatch.id", primary_key=True)
    seq: int = Field(primary_key=True)
    user_id: int = Field(foreign_key=USER_PK)
    day_index: int
    event_type: str = Field(max_length=20)
    payload: Dict = Field(default_factory=dict, sa_column=Column(JSONVariant))
    created_at: datetime = Field(default_factory=datetime.utcnow)


class QTEQuestion(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    question_type: QuestionType = Field(max_length=10)
    prompt: str
    options: List[str] = Field(sa_column=Column(JSONVariant))
    correct_answer: str
    correct_cash_delta_pct: Decimal = Field(default=Decimal("0"), max_digits=6, decimal_places=4)
    incorrect_cash_delta_pct: Decimal = Field(default=Decimal("0"), max_digits=6, decimal_places=4)
    active: bool = Field(default=True)