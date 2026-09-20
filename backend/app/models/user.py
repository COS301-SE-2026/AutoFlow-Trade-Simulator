from typing import Optional

from sqlmodel import Field, SQLModel
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