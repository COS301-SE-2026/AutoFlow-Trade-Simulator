from typing import Optional
from typing import List
from sqlmodel import Field, SQLModel
from sqlalchemy import Column, String
from sqlalchemy.dialects.postgresql import ARRAY
import sqlalchemy as sa


class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(index=True, nullable=False, sa_column_kwargs={"unique": True})
    password_hash: Optional[str] = Field(default=None, nullable=True)
    full_name: str = Field(nullable=False)
    google_sub: Optional[str] = Field(default=None, index=True, nullable=True, sa_column_kwargs={"unique": True})
    experience_points: int = Field(
        default=0,
        sa_column=sa.Column(sa.Integer, nullable=False, server_default=sa.text("0")),
    )
    elo_rating: int = Field(
        default=500,
        sa_column=sa.Column(sa.Integer, nullable=False, server_default=sa.text("500")),
    )
    upgrades: List[str] = Field(
        default_factory=list,
        sa_column=Column(
            ARRAY(String),
            server_default="{}",
            nullable=False
        )
    )