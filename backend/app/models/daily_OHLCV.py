from datetime import datetime
from decimal import Decimal
from sqlmodel import Field, SQLModel

#this will also be converted to a hyper table

class DailyOHLCV(SQLModel,table=True):
    asset_id:int=Field(primary_key=True, foreign_key="asset.asset_id")
    datetime:datetime=Field(primary_key=True)
    open:Decimal=Field(nullable=False, max_digits=18, decimal_places=4)
    high:Decimal=Field(nullable=False, max_digits=18, decimal_places=4)
    low:Decimal=Field(nullable=False, max_digits=18, decimal_places=4)
    close:Decimal=Field(nullable=False, max_digits=18, decimal_places=4)
    volume:Decimal=Field(nullable=False, max_digits=18, decimal_places=4)