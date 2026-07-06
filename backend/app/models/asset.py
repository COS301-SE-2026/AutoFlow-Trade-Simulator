from typing import Optional
from sqlmodel import Field, SQLModel

class Asset(SQLModel,table=True):
    asset_id:Optional[int] = Field(default=None,primary_key=True)
    symbol:str=Field(unique=True, max_length=20)
    asset_class:str=Field(nullable=False, max_length=50)
    exchange:str=Field(nullable=False, max_length=20)
    currency:str=Field(nullable=False, min_length=3 ,max_length=3)
