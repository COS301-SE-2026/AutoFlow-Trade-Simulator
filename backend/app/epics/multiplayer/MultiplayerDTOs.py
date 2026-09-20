from datetime import date
from typing import Dict, List, Literal, Optional

from sqlmodel import SQLModel


class BarDTO(SQLModel):
    open: float
    high: float
    low: float
    close: float
    volume: float


class QteOfferDTO(SQLModel):
    question_id: int
    question_type: Literal["jargon", "scenario"]
    prompt: str
    options: List[str]
    timeout_seconds: int


class MatchFoundMessage(SQLModel):
    type: Literal["match_found"] = "match_found"
    symbol: str
    start_date: date
    end_date: date
    initial_balance: float
    opponent_user_id: int
    total_days: int


class DayMessage(SQLModel):
    type: Literal["day"] = "day"
    day_index: int
    date: date
    bar: BarDTO
    cash_balance: float
    position_qty: float
    qte: Optional[QteOfferDTO] = None


class ActionMessage(SQLModel):
    type: Literal["action"] = "action"
    day_index: int
    action: Literal["buy", "sell", "hold"]
    qty: Optional[float] = None
    qte_answer: Optional[str] = None


class ActionAckMessage(SQLModel):
    type: Literal["action_ack"] = "action_ack"
    day_index: int
    cash_balance: float
    position_qty: float
    error: Optional[str] = None


class QtePlayerOutcome(SQLModel):
    answer: Optional[str] = None
    correct: bool
    cash_delta: float


class QteResultMessage(SQLModel):
    type: Literal["qte_result"] = "qte_result"
    day_index: int
    question_id: int
    correct_answer: str
    per_player: Dict[str, QtePlayerOutcome]


class MatchEndMessage(SQLModel):
    type: Literal["match_end"] = "match_end"
    final_balances: Dict[str, float]
    winner_user_id: Optional[int] = None
    reason: Literal["completed", "opponent_disconnected"]


class ErrorMessage(SQLModel):
    type: Literal["error"] = "error"
    detail: str
