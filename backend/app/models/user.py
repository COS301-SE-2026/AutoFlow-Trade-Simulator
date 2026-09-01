from typing import Optional

from sqlmodel import Field, SQLModel


class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(index=True, nullable=False, sa_column_kwargs={"unique": True})
    password_hash: Optional[str] = Field(default=None, nullable=True)
    full_name: str = Field(nullable=False)
    google_sub: Optional[str] = Field(default=None, index=True, nullable=True, sa_column_kwargs={"unique": True})
