from datetime import datetime, timedelta
from fastapi import HTTPException, status
from sqlmodel import   Session, select

from .RealTimeDataDTOs import DataPoint, DataResponseDTO, EpicStatusDTO, MoverDTO, MoversResponseDTO, SymbolResponseDTO
from ...models.real_time_ticks import RealTimeTicks
from ...models.asset import Asset

class RealTimeDataService:
    def __init__(self,session:Session) -> None:
        self.session = session
    
    @staticmethod
    def get_status() -> EpicStatusDTO:
        return EpicStatusDTO(
            epic="Real Time Data",
            status="healthy",
        )

    def get_real_time_data(self, symbol: str) -> DataResponseDTO:
        asset_id:int|None= self.session.exec(select(Asset.asset_id).where(Asset.symbol==symbol)).first()
        if asset_id is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,detail=f"Asset not found for symbol: {symbol}")

        today:datetime= datetime.utcnow()
        yesterday:datetime = today+timedelta(days=-1)

        ticks: list[RealTimeTicks] =list(self.session.exec(select(RealTimeTicks).where(RealTimeTicks.asset_id==asset_id).where(RealTimeTicks.timestamp>yesterday)).all())
        points:list[DataPoint]=[]
        for tick in ticks:
            points.append(DataPoint(timestamp=tick.timestamp,price=tick.price,volume=tick.volume))
        return DataResponseDTO(points=points)

    def get_symbol_list(self)->SymbolResponseDTO:
        symbols:list[str]= list(self.session.exec(select(Asset.symbol).where(RealTimeTicks.asset_id==Asset.asset_id).distinct()).all())
        count:int = len(symbols)
        return SymbolResponseDTO(symbols=symbols,count=count)

    def get_top_movers(self,limit:int=10)->MoversResponseDTO:
        today:datetime= datetime.utcnow()
        yesterday:datetime = today+timedelta(days=-1)

        ticks: list[RealTimeTicks] = list(self.session.exec(
            select(RealTimeTicks).where(RealTimeTicks.timestamp>yesterday).order_by(RealTimeTicks.timestamp)
        ).all())

        if not ticks:
            return MoversResponseDTO(movers=[])

        # Aggregate per-asset in Python: earliest tick is the baseline for pct_change,
        # latest tick is the current price, min/max across the window are daily low/high.
        agg: dict[int, dict] = {}
        for tick in ticks:
            aid = tick.asset_id
            if aid not in agg:
                agg[aid] = {
                    "baseline_price": tick.price,
                    "current_price": tick.price,
                    "current_timestamp": tick.timestamp,
                    "high": tick.price,
                    "low": tick.price,
                }
            else:
                bucket = agg[aid]
                if tick.timestamp >= bucket["current_timestamp"]:
                    bucket["current_price"] = tick.price
                    bucket["current_timestamp"] = tick.timestamp
                if tick.price > bucket["high"]:
                    bucket["high"] = tick.price
                if tick.price < bucket["low"]:
                    bucket["low"] = tick.price

        asset_ids = list(agg.keys())
        assets: list[Asset] = list(self.session.exec(select(Asset).where(Asset.asset_id.in_(asset_ids))).all())
        symbol_by_asset_id: dict[int, str] = {a.asset_id: a.symbol for a in assets if a.asset_id is not None}

        movers: list[MoverDTO] = []
        for aid, bucket in agg.items():
            symbol = symbol_by_asset_id.get(aid)
            if symbol is None:
                continue

            baseline = bucket["baseline_price"]
            current = bucket["current_price"]
            pct_change = float((current - baseline) / baseline * 100) if baseline else 0.0

            movers.append(MoverDTO(
                ticker=symbol,
                current_price=current,
                daily_high=bucket["high"],
                daily_low=bucket["low"],
                pct_change=pct_change,
                timestamp=bucket["current_timestamp"],
            ))

        movers.sort(key=lambda m: abs(m.pct_change), reverse=True)

        return MoversResponseDTO(movers=movers[:limit])
