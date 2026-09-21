from enum import Enum
from typing import Dict, Optional
from sqlmodel import SQLModel
from pydantic import Field

class EpicStatusDTO(SQLModel):
    epic: str
    status: str

class Grade(str, Enum):
    S = "S"
    A = "A"
    B = "B"
    C = "C"
    D = "D"
    E = "E"
    F = "F"

class EvaluateMatchRequestDTO(SQLModel):
    match_id: int = Field(..., description="This is the match id e.x. 123")
    user_id: int = Field(..., description="This is the user id e.x. 123")

class CategoryScoreDTO(SQLModel):
    score: float = Field(..., ge=0.0, le=100, description="Score out of 100")
    weight: float = Field(..., ge=0.0, le=1.0, description="Weighting factor")
    feedback: str = Field(..., description="Targeted performance feedback")

class ExecutionMetricDTO(SQLModel):
    total_return_pct: float = Field(
        ...,
        description="Total strategy return in percentage (e.g. 14.2 for +14.2%)"
    )
    max_drawdown_pct: float = Field(
        ...,
        ge=0.0,
        le=100.0,
        description="Peak-to-trough drop percentage (e.g. 4.5 for 4.5%)"
    )
    sharpe_ratio: float = Field (
        ...,
        description="Risk adjusted return ratio (typically -3.0 to 5.0)"
    )
    total_trades: int = Field (
        ...,
        ge=0,
        description="Total count of completed trades"
    )
    win_rate: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Ratio of profitable trade to total trades (0.0 to 1.0)"
    )
    avg_holding_period_sec: float = Field (
        ...,
        ge=0.0,
        description="Average position duration in seconds"
    )
    benchmark_return_pct: Optional[float] = Field (
        default=0.0,
        description="Baseline index return percentage over the same window"
    )

class EvaluationResultDTO(SQLModel):
    passed: bool = Field (
        ...,
        description="Whether the learner passed the puzzle"
    )
    final_score: float = Field (
        ...,
        ge=0.0,
        le=100.0,
        description="Weighted rubric score out of 100"
    )
    grade: Grade
    detail_breakdown: Dict[str, CategoryScoreDTO] = Field (
        default_factory=dict,
        description="Detailed feedback and score breakdown per evaluation category"
    )
