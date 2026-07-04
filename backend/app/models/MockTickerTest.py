from datetime import datetime
from decimal import Decimal
from sqlmodel import Field, SQLModel

class MockTickerTest(SQLModel, table=True):
    
    id:int=Field(default=None, primary_key=True)
    timestamp:datetime=Field(primary_key=True)
    symbol:str=Field(index=True)
    price:Decimal=Field(nullable=False, max_digits=18, decimal_places=4)
    volume:int=Field(nullable=False)