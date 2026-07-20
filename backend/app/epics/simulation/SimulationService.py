from fastapi import HTTPException, status
from datetime import date,  timedelta
from datetime import datetime,time
from decimal import Decimal
from typing import Dict, List, Optional
from sqlmodel import   Session, col, select

from ...models.strategies import Strategies
from ...models.daily_OHLCV import DailyOHLCV
from ...models.asset import Asset
from ...models.practice_simulation import PraticeSimulation
from .SimulationDTOs import PerSymbolResult, SimulationAppendRequest, SimulationCreateRequest, SimulationFinishResponse, SimulationSessionResponse, SimulationSummary, StrategiesResponse, EpicStatusDTO, StrategyDetail, StrategySummary

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
        summaries=[]
        for s in strategies:
            assert s.strat_id is not None, "Strategy ID should not be None"
            summaries.append(StrategySummary(id=s.strat_id,name=s.name,level=s.level,category=s.category,description=s.description))
        return StrategiesResponse(strategies=summaries)
    
    def get_strategy_detail(self,strategy_id:int)->StrategyDetail:

        strategy:Strategies|None=self.session.get(Strategies,strategy_id)
        if strategy is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,detail="Strategy not found")
        assert strategy.strat_id is not None, "Strategy ID should not be None"
        return StrategyDetail(id=strategy.strat_id,name=strategy.name,level=strategy.level,category=strategy.category,description=strategy.description,steps=strategy.steps,pros=strategy.pros,cons=strategy.cons)
    
    def validate_limits(self,symbol:List[str],start:date,end:date):
        if len(symbol)>MAX_SYMBOLS:
            raise ValueError(f"Max symbols is {MAX_SYMBOLS}")
        if (end-start).days>(MAX_YEARS*365):
            raise ValueError("Date range too large")

    def load_bar_at_date(self,symbol:str,start:date,end:date,timestamp:datetime)->DailyOHLCV:
        execution_date:date= timestamp.date()
        if execution_date<start or execution_date>end:
            raise ValueError("timestamp is not within simulation date range")
        
        asset_id= self.session.exec(select(Asset.asset_id).where(Asset.symbol== symbol)).first()
        if asset_id is None:
            raise ValueError(f"Symbol: {symbol} does not exist")
        day_start=datetime.combine(execution_date,time.min)
        day_end = datetime.combine(execution_date,time.max)
        result= self.session.exec(select(DailyOHLCV).where(DailyOHLCV.timestamp>=day_start).where(DailyOHLCV.timestamp<=day_end).where(DailyOHLCV.asset_id==asset_id)).first()
        if result is None:
            raise ValueError("No OHLCV found on date")
        return result

    def load_bars(self,symbol:str,start:date,end:date)-> List[DailyOHLCV]:
        asset_id= self.session.exec(select(Asset.asset_id).where(Asset.symbol== symbol)).first()
        if asset_id is None:
            raise ValueError("Symbols doesnt exist")
        result:list= list(self.session.exec(select(DailyOHLCV).where(DailyOHLCV.asset_id==asset_id).where(DailyOHLCV.timestamp <= end).where(DailyOHLCV.timestamp>=start).order_by(col(DailyOHLCV.timestamp))).all())
        return result

    def build_allocations(self,symbols:List[str],allocations:Optional[Dict[str,Decimal]])->Dict[str,Decimal]:
        if allocations is None:
            return{s:Decimal('0') for s in symbols}
        relevant = {s: allocations.get(s, Decimal("0")) for s in symbols}
        total= sum(relevant.values())
        if total<0 or total>1:
            raise ValueError("Allocations must sum to a value between 0 and 1")
        return relevant




    def create_simulation_session(self,req:SimulationCreateRequest,user_id:int)->SimulationSessionResponse:
        self.validate_limits(req.symbols,req.start_date,req.end_date)
        allocations:Dict[str,Decimal]= self.build_allocations(req.symbols,req.allocations)
        positions:Dict[str,Decimal]={}
        cash= req.initial_balance
        for s in req.symbols:
            bars:List[DailyOHLCV]= self.load_bars(s,req.start_date,req.end_date)
            if not bars:
                positions[s]=Decimal('0')
                continue
            budget= allocations[s] * req.initial_balance
            price =bars[0].close
            asset_quantity= (budget/price) if price>0 else Decimal('0')
            positions[s]=asset_quantity.quantize(Decimal("0.0001"))
            cash-= asset_quantity*price


        float_positions:Dict[str,float]={s:float(v) for [s,v] in positions.items()}
        float_allocations:Dict[str,float]={s:float(v) for [s,v] in allocations.items()}
        sim=PraticeSimulation(user_id=user_id,symbols=req.symbols,start_date=req.start_date,end_date=req.end_date,initial_balance=req.initial_balance,allocations=float_allocations,current_balance=cash,positions=float_positions)
        self.session.add(sim)
        self.session.commit()
        self.session.refresh(sim)
        if sim.id is None:
            raise ValueError("No simulation id found")
        return SimulationSessionResponse(simulation_id=sim.id,status=sim.status,positions=positions,nav=req.initial_balance)


    def append_simulation_actions(self,req:SimulationAppendRequest,user_id:int)->SimulationSessionResponse:
        # check if simulation_id is valid
        sim:PraticeSimulation= self.session.exec(select(PraticeSimulation).where(PraticeSimulation.id==req.simulation_id)).one()
        if sim.user_id != user_id:
            raise  HTTPException(status_code=status.HTTP_403_FORBIDDEN,detail="This simulation does not belong to the current user")
        positions:Dict[str,Decimal]= dict({s:Decimal(str(v)) for s,v in sim.positions.items()} or {})
        last_prices:Dict[str,Decimal]= dict({s:Decimal(str(v)) for s,v in sim.last_prices.items()}or {})
        actions_log:List[Dict]= list(sim.actions or [])

        for action in req.actions:
        
            quantity= action.qty
            if quantity<=0:
                raise ValueError("buy quantity cannot be non-postive")

            price:Decimal|None=action.price
            bar=self.load_bar_at_date(action.symbol,sim.start_date,sim.end_date,action.timestamp)
            if price is None:
                price=bar.close
            elif (price<bar.low or price>bar.high):
                raise ValueError(f"Price {action.price} is outside the trading range for {action.symbol} on {action.timestamp.date()}")

            if action.type=="buy":
                #do buy action
                cost= quantity*price
                if cost> sim.current_balance:
                    raise ValueError("Insufficent cash for buy") 
                sim.current_balance-=cost
                positions[action.symbol]= positions.get(action.symbol,Decimal("0"))+quantity
                

                #finde bar that matches timestamp

            elif action.type=="sell":
                #do sell action
                held=positions.get(action.symbol,Decimal("0"))
                if held<quantity:
                    raise ValueError("Insufficient holdings to sell")
                sim.current_balance+=quantity*price
                positions[action.symbol]= held - quantity 

            else:
                raise ValueError(f"Unknown action type: {action.type} ")
            last_prices[action.symbol]=price
            actions_log.append({"type":action.type,"symbol": action.symbol,"qty":float(action.qty),"price":float(price),"timestamp": action.timestamp.isoformat()})

        sim.positions={s:float(v) for s,v in positions.items()}
        sim.last_prices={s:float(v) for s,v in last_prices.items()}
        sim.actions=actions_log
        self.session.add(sim)
        self.session.commit()
        self.session.refresh(sim)
        if sim.id  is None:
            raise ValueError("Sim ID was not found")
        nav = sim.current_balance + sum(
        positions[s] * last_prices.get(s, Decimal("0")) for s in positions)
        return SimulationSessionResponse(simulation_id=sim.id, status=sim.status, positions=positions, nav=nav)

    def finalize_simulation(self,simulation_id:int,user_id:int)->SimulationFinishResponse:
        sim:PraticeSimulation=self.session.exec(select(PraticeSimulation).where(PraticeSimulation.id==simulation_id)).one()
        if sim.user_id != user_id:
            raise  HTTPException(status_code=status.HTTP_403_FORBIDDEN,detail="This simulation does not belong to the current user")
        #load bars and check rows
        bars_by_symbol:Dict[str,List[DailyOHLCV]]={}
        total_rows=0
        for s in sim.symbols:
            bars =self.load_bars(s,sim.start_date,sim.end_date)
            bars_by_symbol[s]= bars
            total_rows+=len(bars)
            if total_rows>MAX_ROWS:
                raise ValueError("Requested data too large")
        closes_by_symbol:Dict[str,Dict[date,Decimal]]= {s:{b.timestamp.date():b.close for b in bars} for s,bars in bars_by_symbol.items()}
        sorted_actions=sorted(
        sim.actions or [],
        key=lambda a: datetime.fromisoformat(a["timestamp"]),
    )
        cash=sim.initial_balance
        positions:Dict[str,Decimal]={s:Decimal('0') for s in sim.symbols}
        net_cost_by_symbol:Dict[str,Decimal]={s:Decimal('0') for s in sim.symbols}
        action_idx=0
        last_close:Dict[str,Decimal]={s:Decimal('0') for s in sim.symbols}
        nav_series:List[Decimal]=[]
        current_date=sim.start_date
        while current_date<= sim.end_date:
            for s in sim.symbols:
                price=closes_by_symbol[s].get(current_date)
                if price is not None:
                    last_close[s] = price

            while action_idx < len(sorted_actions):
                a=sorted_actions[action_idx]
                qty=Decimal(str(a['qty']))
                price=Decimal(str(a['price']))
                symbol=a['symbol']
                if a['type']=='buy':
                    cash-=qty*price
                    positions[symbol]=positions.get(symbol,Decimal('0'))+qty
                    net_cost_by_symbol[symbol]=net_cost_by_symbol.get(symbol,Decimal('0'))+qty*price
                elif a['type']=='sell':
                    cash+=qty*price
                    positions[symbol]=positions.get(symbol,Decimal('0'))-qty
                    net_cost_by_symbol[symbol]=net_cost_by_symbol.get(symbol,Decimal('0'))-qty*price
                action_idx+=1
                    
            nav=cash+sum(positions[s]*last_close[s] for s in sim.symbols)
            nav_series.append(nav)
            current_date+=timedelta(days=1)

        final_balance=nav_series[-1] if nav_series else sim.initial_balance
        returns_pct=((final_balance/sim.initial_balance)-Decimal('1'))*Decimal('100')
        max_dd=compute_max_drawdown(nav_series)
        trades_count= len(sorted_actions)
        
        per_symbol_results:Dict[str,PerSymbolResult]={}
        for s in sim.symbols:
            final_value=positions[s]*last_close[s]
            net_cost=net_cost_by_symbol[s]
            symbol_returns=((final_value-net_cost)/net_cost)*Decimal('100') if net_cost>0 else Decimal('0')
            per_symbol_results[s]=PerSymbolResult(final_value=final_value,returns_pct=symbol_returns)
        
        summary=SimulationSummary(final_balance=final_balance,returns_pct=returns_pct,max_drawdown=max_dd,trades_count=trades_count,per_symbol_results=per_symbol_results)
        sim.current_balance=cash
        sim.positions={s:float(v) for s,v in positions.items()}
        sim.last_prices={s:float(v) for s,v in last_close.items()}
        sim.summary={"final_balance": float(final_balance),"returns_pct": float(returns_pct),"max_drawdown": float(max_dd),"trades_count": trades_count,"per_symbol_results": {s: {"final_value": float(r.final_value), "returns_pct": float(r.returns_pct)}for s, r in per_symbol_results.items()},}
        sim.status="completed"
        sim.finished_at=datetime.utcnow()
        self.session.add(sim)
        self.session.commit()
        self.session.refresh(sim)
        if sim.id is None:
            raise ValueError("sim id was not refreshed")
        return SimulationFinishResponse(simulation_id=sim.id,status=sim.status,start_date=sim.start_date,end_date=sim.end_date,initial_balance=sim.initial_balance,summary=summary)





