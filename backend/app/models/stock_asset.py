
from typing import Optional
from sqlmodel import Field, SQLModel
class StockAsset(SQLModel,table=True):
    id:Optional[int]= Field(default=None,primary_key=True)
    asset_id:int = Field(default=None,foreign_key="asset.asset_id")

