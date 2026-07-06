from datetime import datetime
from decimal import Decimal
from sqlmodel import Field, SQLModel

#this will be converted to a hyper table

class RealTimeTicks(SQLModel,table=True):
    asset_id:int=Field(primary_key=True, foreign_key="asset.asset_id")
    datetime:datetime=Field(primary_key=True)
    price:Decimal=Field(nullable=False, max_digits=18, decimal_places=4)
    volume:Decimal=Field(nullable=False, max_digits=18, decimal_places=4)
