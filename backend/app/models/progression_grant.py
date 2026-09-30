from datetime import datetime
from sqlmodel import Field, SQLModel
from typing import Optional
from enum import Enum
import sqlalchemy as sa


class ProgressionSource(str, Enum):
    match = "match"
    puzzle = "puzzle"
    tutorial = "tutorial"


class ProgressionGrant(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    source_type: ProgressionSource = Field(sa_column=sa.Column(
        sa.Enum(ProgressionSource, name="progression_source", values_callable=lambda x: [e.value for e in x]),
        nullable=False,
    ))
    source_id: int
    xp_awarded: int
    elo_delta: int = Field(default=0)
    created_at: datetime = Field(default_factory=datetime.utcnow)

# use user_id, source_type, source_id to check idempotency