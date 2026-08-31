from sqlmodel import Field, SQLModel
from decimal import Decimal
from typing import Optional

class BackTestResults(SQLModel, table=True):
    backtest_id:Optional[int]=Field(default=None, primary_key=True)
    simu_id:int=Field(foreign_key="praticesimulation.id")
    user_id:int=Field(foreign_key="user.id")
    asset_symbol:str=Field(nullable=False, max_length=10)
    timeframe:str=Field(nullable=False, max_length=10)
    total_trade:Optional[int]=Field(default=None)
    win_rate_percentage:Optional[Decimal]=Field(default=None, max_digits=18, decimal_places=4)
