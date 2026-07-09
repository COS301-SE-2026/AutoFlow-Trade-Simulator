from datetime import datetime
from sqlmodel import Field, SQLModel
from decimal import Decimal
from typing import Optional

class PraticeSimulation(SQLModel, table=True):
    simu_id:Optional[int]=Field(default=None, primary_key=True)
    user_id:int=Field(foreign_key="user.id")
    strat_id:int=Field(foreign_key="strategies.strat_id")
    status:str=Field(nullable=False, max_length=15)
    initial_capital:Decimal=Field(nullable=False, max_digits=18, decimal_places=4)
    current_balance:Decimal=Field(nullable=False, max_digits=18, decimal_places=4)
    total_equity:Decimal=Field(nullable=False, max_digits=18, decimal_places=4)
    simu_speed:int=Field(default=1)
    created_at:datetime=Field(default_factory=datetime.now)
    updated_at:Optional[datetime] = Field(default=None)