from datetime import datetime,timezone
from enum import Enum
from typing import Optional
from sqlmodel import Field, SQLModel

class Period(Enum):
    Daily = "daily"
    Weekly = "weekly"

class Report(SQLModel, table = True):
    id:Optional[int] = Field(default=None,primary_key=True)
    user_id: int = Field(foreign_key="user.id", index=True)
    period: Period = Field(sa_column_kwargs={"name": "period_enum"})
    generated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))