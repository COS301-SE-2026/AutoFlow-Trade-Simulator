
from typing import Optional
from sqlmodel import Field, SQLModel
class Asset(SQLModel,table=True):
    id:Optional[int] = Field(default=None,primary_key=True)
    ticker:str = Field(default=None)
    name:str = Field(default=None)
    asset_type:str = Field(default=None)
