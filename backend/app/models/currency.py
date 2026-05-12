from typing import Optional
from sqlmodel import Field, SQLModel 

class Currency(SQLModel,table=True):
    id:Optional[int] =Field(default=None,primary_key=True)
    code:str = Field(default=None,nullable=False,max_length=3)
    name:str = Field(default=None)
