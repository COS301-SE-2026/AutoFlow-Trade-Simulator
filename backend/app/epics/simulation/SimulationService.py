
from decimal import Decimal
from typing import List
from sqlmodel import Session, select

from ...models.strategies import Strategies
from .SimulationDTOs import StrategiesResponse, EpicStatusDTO



def compute_max_drawdown(nav_series:List[Decimal])->Decimal:
    if not nav_series:
        return Decimal("0")
    peak= nav_series[0]
    max_dd=Decimal('0')
    for v in nav_series:
        if v>peak:
            peak=v
        dd = (peak - v) / peak if peak > 0 else Decimal('0')
        if dd>max_dd:
            max_dd=dd
    return(max_dd* Decimal('100')).quantize(Decimal("0.01"))


class SimulationService:
    def __init__(self,session:Session) -> None:
        self.session = session
    
    @staticmethod
    def get_status() -> EpicStatusDTO:
        return EpicStatusDTO(
            epic="greeks",
            status="healthy",
        )
        
    def get_strategies(self)->StrategiesResponse:
        strategies= self.session.exec(select(Strategies)).all()
        return StrategiesResponse(strategies=list(strategies))

