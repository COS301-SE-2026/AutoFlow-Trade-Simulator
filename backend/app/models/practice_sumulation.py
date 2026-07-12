from datetime import datetime
from sqlmodel import Field, SQLModel
from decimal import Decimal
from typing import Optional

class PraticeSimulation(SQLModel, table=True):
    simu_id:Optional[int]=Field(default=None, primary_key=True)
    strat_id:int=Field(foreign_key="strategies.strat_id")
    status:str=Field(nullable=False, max_length=15)