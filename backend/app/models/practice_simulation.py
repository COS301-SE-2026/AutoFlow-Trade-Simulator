from datetime import date, datetime
from sqlmodel import JSON, Column, Field, SQLModel
from decimal import Decimal
from typing import Dict, List, Optional

class PraticeSimulation(SQLModel, table=True):
    id:Optional[int]=Field(default=None, primary_key=True)
    user_id:int= Field(foreign_key="user.id")
    symbols:List[str]=Field(sa_column=Column(JSON),default_factory=list)
    start_date:date
    end_date:date
    initial_balance:Decimal
    allocations:Optional[Dict[str,Decimal]]=Field(default=None,sa_column=Column(JSON))
    summary:Optional[Dict]=Field(default=None,sa_column=Column(JSON))
    status:str=Field(nullable=False, max_length=15,default="in_progress")
    created_at:datetime=Field(default_factory=datetime.utcnow)
    finished_at:Optional[datetime]=Field(default=None)
