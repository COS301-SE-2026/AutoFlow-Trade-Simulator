from datetime import datetime, timedelta
from fastapi import HTTPException, status
from sqlmodel import   Session, select

from .RealTimeDataDTOs import DataPoint, DataResponseDTO, EpicStatusDTO, SymbolResponseDTO
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
        

