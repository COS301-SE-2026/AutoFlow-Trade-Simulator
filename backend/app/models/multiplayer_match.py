from datetime import date, datetime
from decimal import Decimal
from enum import Enum
from typing import Dict, List, Optional

from sqlalchemy.dialects.postgresql import JSONB
from sqlmodel import Column, Field, JSON, SQLModel

JSONVariant = JSONB().with_variant(JSON, "sqlite")


class MatchStatus(str, Enum):
    in_progress = "in_progress"
    completed = "completed"
    abandoned = "abandoned"


class QuestionType(str, Enum):
    jargon = "jargon"
    scenario = "scenario"


class QteAttempt(SQLModel):
    question_id: int
    answer: Optional[str] = None
    correct: bool
    cash_delta: float


class ActionLogEntry(SQLModel):
    day_index: int
    date: date
    type: str
    qty: float
    price: float
    qte: Optional[QteAttempt] = None


class MultiplayerMatch(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    scenario_id: int = Field(foreign_key="scenario.id")
    symbol: str = Field(max_length=20)
    start_date: date
    end_date: date
    initial_balance: Decimal = Field(max_digits=18, decimal_places=4)
    status: MatchStatus = Field(default=MatchStatus.in_progress, max_length=15)
    player_one_id: int = Field(foreign_key="user.id")
    player_two_id: int = Field(foreign_key="user.id")
    winner_user_id: Optional[int] = Field(default=None, foreign_key="user.id")
    current_day_index: int = Field(default=0)
    started_at: datetime = Field(default_factory=datetime.utcnow)
    ended_at: Optional[datetime] = Field(default=None)


class MultiplayerParticipant(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    match_id: int = Field(foreign_key="multiplayermatch.id")
    user_id: int = Field(foreign_key="user.id")
    perturbation_seed: int
    cash_balance: Decimal = Field(max_digits=18, decimal_places=4)
    position_qty: Decimal = Field(default=Decimal("0"), max_digits=18, decimal_places=4)
    final_balance: Optional[Decimal] = Field(default=None, max_digits=18, decimal_places=4)
    action_log: List[Dict] = Field(default_factory=list, sa_column=Column(JSONVariant))
    disconnected_at: Optional[datetime] = Field(default=None)


class QTEQuestion(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    question_type: QuestionType = Field(max_length=10)
    prompt: str
    options: List[str] = Field(sa_column=Column(JSONVariant))
    correct_answer: str
    correct_cash_delta_pct: Decimal = Field(default=Decimal("0"), max_digits=6, decimal_places=4)
    incorrect_cash_delta_pct: Decimal = Field(default=Decimal("0"), max_digits=6, decimal_places=4)
    active: bool = Field(default=True)
