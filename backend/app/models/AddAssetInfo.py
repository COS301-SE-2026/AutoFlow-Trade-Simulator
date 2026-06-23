from typing import Optional
from sqlmodel import Field, SQLModel
from datetime import datetime, timezone
from decimal import Decimal 

class AddAssetInfo(SQLModel, table=True):
    id: Optional[int]= Field(default=None, primary_key=True)
    asset_id:int =Field(foreign_key="asset.id", index=True, nullable=False)
    strike_price:Decimal = Field(max_digits=19, decimal_places=4, nullable=False)
    expr_date: datetime = Field(nullable=False)
    option_type:str = Field(nullable=False)
    imp_volatility: float = Field(nullable=False)