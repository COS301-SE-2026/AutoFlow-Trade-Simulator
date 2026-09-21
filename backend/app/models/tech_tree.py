from typing import Any, Dict, Optional
from uuid import UUID

from sqlalchemy import Column
from sqlalchemy.dialects.postgresql import JSONB, UUID as PG_UUID
from sqlmodel import Field, SQLModel


class TechTree(SQLModel, table=True):
    __tablename__ = "techtree"

    node_id: Optional[UUID] = Field(
        default=None,
        sa_column=Column(PG_UUID(as_uuid=True), primary_key=True, server_default="gen_random_uuid()"),
    )
    node: Dict[str, Any] = Field(sa_column=Column(JSONB, nullable=False))