from datetime import datetime
from sqlmodel import Field, SQLModel
from sqlalchemy.dialects.postgresql import JSONB
from typing import Optional

class Strategies(SQLModel, table=True):
    strat_id:Optional[int]=Field(default=None, primary_key=True)
    user_id:int=Field(foreign_key="user.id")
    name:str=Field(nullable=False, max_length=50)
    is_active:bool=Field(default=False)
    description:Optional[str]=Field(nullable=False, max_length=10000)
    parameters: Optional[dict]= Field(default=None, sa_type=JSONB)
    created_at:datetime=Field(default_factory=datetime.now)
    updated_at:Optional[datetime]= Field(default=None)