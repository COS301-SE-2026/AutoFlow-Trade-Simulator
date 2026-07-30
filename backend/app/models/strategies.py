from sqlalchemy.dialects.postgresql import JSONB
from sqlmodel import Column, Field, SQLModel, JSON
from typing import List, Optional

JSONVariant = JSONB().with_variant(JSON, "sqlite")
class Strategies(SQLModel, table=True):
    strat_id:Optional[int]=Field(default=None, primary_key=True)
    name:str=Field(nullable=False, max_length=50)
    description:str=Field(nullable=False)
    level:str=Field(nullable=False, max_length=20)
    category:str=Field(nullable=False, max_length=50)
    steps:List[str]=Field(default_factory=list, sa_column=Column(JSONVariant))
    pros:List[str]=Field(default_factory=list, sa_column=Column(JSONVariant))
    cons:List[str]=Field(default_factory=list, sa_column=Column(JSONVariant))
