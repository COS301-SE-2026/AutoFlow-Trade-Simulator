from datetime import datetime
from sqlmodel import Field, SQLModel
from decimal import Decimal
from typing import Optional
from sqlalchemy.dialects.postgresql import JSONB

class BackTestResults(SQLModel, table=True):
    backtest_id:Optional[int]=Field(default=None, primary_key=True)
    user_id:int=Field(foreign_key="user.id")
    asset_symbol:str=Field(nullable=False, max_length=10)
    timeframe:str=Field(nullable=False, max_length=10)
    start_date:datetime=Field(nullable=False)
    end_date:Optional[datetime]=Field(default=None)
    initial_balance:Decimal=Field(nullable=False, max_digits=18, decimal_places=4)
    final_balance:Decimal=Field(nullable=False, max_digits=18, decimal_places=4)
    total_return_percentage:Decimal=Field(nullable=False, max_digits=18, decimal_places=4)
    sharpe_ratio:Decimal=Field(nullable=False, max_digits=18, decimal_places=4)
    max_drawdown_percentage:Decimal=Field(nullable=False, max_digits=18, decimal_places=4)
    total_trade:Optional[int]=Field(default=None)
    win_rate_percentage:Optional[Decimal]=Field(default=None, max_digits=18, decimal_places=4)
    equity_curve: Optional[dict] = Field(default=None, sa_type=JSONB)