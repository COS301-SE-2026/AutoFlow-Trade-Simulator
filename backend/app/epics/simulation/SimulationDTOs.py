from typing import Any, Dict, List, Optional
from sqlmodel import SQLModel
from decimal import Decimal
from datetime import date, datetime
class EpicStatusDTO(SQLModel):
    epic: str
    status: str
class StrategySummary(SQLModel):
    id: int
    name: str
    level: str
    category: str
    description: str

class StrategyDetail(StrategySummary):
    id: int
    name: str
    level: str
    category: str
    description: str
    steps: List[str]
    pros: List[str]
    cons: List[str]

class StrategiesResponse(SQLModel):
    strategies: list[StrategySummary]

class SimulationAction(SQLModel):
    type:str #buy or sell
    symbol:str
    qty: Decimal
    price: Optional[Decimal] =None
    timestamp: datetime
    meta: Optional[Dict[str, Any]] = None

class SimulationCreateRequest(SQLModel):
    symbols:List[str]
    allocations:Optional[Dict[str,Decimal]]
    start_date:date
    end_date:date
    initial_balance:Decimal = Decimal('10000')

class SimulationAppendRequest(SQLModel):
    simulation_id:int
    actions: List[SimulationAction]

class PerSymbolResult(SQLModel):
    final_value:Decimal
    returns_pct:Decimal

class SimulationSummary(SQLModel):
    final_balance:Decimal
    returns_pct:Decimal
    max_drawdown:Decimal
    trades_count:int
    per_symbol_results:Dict[str,PerSymbolResult]
    
class SimulationSessionResponse(SQLModel):
    simulation_id:int
    status:str
    positions:Dict[str,Decimal]
    nav:Decimal

class SimulationFinishResponse(SQLModel):
    simulation_id:int
    status:str
    start_date:date
    end_date:date
    initial_balance:Decimal
    summary:SimulationSummary
    errors:Optional[List[str]]=None




