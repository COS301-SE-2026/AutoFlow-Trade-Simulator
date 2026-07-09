from datetime import datetime
from sqlmodel import Field, SQLModel

class Strategies(SQLModel, table=True):
    start_id:int | None =Field(default=None, primary_key=True)
    user_id:int=Field(foreign_key="user.id")
    name:str=Field(nullable=False, max_length=50)
    is_active:bool=Field(default=False)
    description:str | None =Field(nullable=False, max_length=10000)
    created_at:datetime=Field(default_factory=datetime.now)
    updated_at:datetime | None = Field(default=None)