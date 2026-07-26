from datetime import date, datetime
from sqlmodel import Column, Field, SQLModel,JSON
from sqlalchemy.dialects.postgresql import JSONB
from decimal import Decimal
from typing import Dict, List, Optional

JSONVariant = JSONB().with_variant(JSON, "sqlite")
class PraticeSimulation(SQLModel, table=True):
    id:Optional[int]=Field(default=None, primary_key=True)
    user_id:int= Field(foreign_key="user.id")
    symbols:List[str]=Field(sa_column=Column(JSONVariant),default_factory=list)
    start_date:date
    end_date:date
    initial_balance:Decimal
    current_balance:Decimal
    positions:Dict[str,float]=Field(sa_column=Column(JSONVariant))
    allocations:Optional[Dict[str,float]]=Field(default=None,sa_column=Column(JSONVariant))
    last_prices: Dict[str, float]=Field(default_factory=dict,sa_column=Column(JSONVariant))
    actions:List[Dict]=Field(default_factory=list,sa_column=Column(JSONVariant))
    summary:Optional[Dict]=Field(default=None,sa_column=Column(JSONVariant))
    status:str=Field(nullable=False, max_length=15,default="in_progress")
    created_at:datetime=Field(default_factory=datetime.utcnow)
    finished_at:Optional[datetime]=Field(default=None)
