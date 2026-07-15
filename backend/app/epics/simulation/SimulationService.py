
from datetime import date
from decimal import Decimal
from typing import List, Optional
from sqlalchemy import Select
from sqlalchemy.engine import result
from sqlmodel import Session, select

from ...models.strategies import Strategies
from ...models.daily_OHLCV import DailyOHLCV
from ...models.asset import Asset
from .SimulationDTOs import SimulationCreateRequest, SimulationFinishResponse, StrategiesResponse, EpicStatusDTO

MAX_SYMBOLS = 20
MAX_YEARS = 5
MAX_ROWS = 100_000

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
    
    def validate_limits(self,symbol:List[str],start:date,end:date):
        if len(symbol)>MAX_SYMBOLS:
            raise ValueError(f"Max symbols is {MAX_SYMBOLS}")
        if (end-start).days>(MAX_YEARS*365):
            raise ValueError("Date range too large")

    def load_bars(self,symbol:str,start:date,end:date)-> List[DailyOHLCV]:
        asset_id= self.session.exec(select(Asset.asset_id).where(Asset.symbol== symbol)).first()
        if asset_id is None:
            raise ValueError("Symbols doesnt exist")
        result:list= list(self.session.exec(select(DailyOHLCV).where(DailyOHLCV.asset_id==asset_id)).all())
        return result

    def run_backtest(self,req:SimulationCreateRequest,user_id:Optional[int])->SimulationFinishResponse:
        self.validate_limits(req.symbols,req.start_date,req.end_date)

        #load bars and check rows
        bars_by_symbol={}
        total_rows=0
        for s in req.symbols:
            bars =self.load_bars(s,req.start_date,req.end_date)
            bars_by_symbol[s]= bars
            total_rows+=len(bars)
            if total_rows>MAX_ROWS:
                raise ValueError("Requested data too large")






