from typing import Optional
from sqlalchemy.dialects.postgresql import ARRAY
from sqlmodel import Field, SQLModel, Column
import sqlalchemy as sa


class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(index=True, nullable=False, sa_column_kwargs={"unique": True})
    password_hash: Optional[str] = Field(default=None, nullable=True)
    full_name: str = Field(nullable=False)
    google_sub: Optional[str] = Field(default=None, index=True, nullable=True, sa_column_kwargs={"unique": True})
    currency: int = Field(default=0, nullable=False)
    elo: int = Field(default=0, nullable=False)
    upgrades: list[str] = Field(
        default_factory=list,
        sa_column=Column(ARRAY(sa.String), nullable=False, server_default="{}")
    )
