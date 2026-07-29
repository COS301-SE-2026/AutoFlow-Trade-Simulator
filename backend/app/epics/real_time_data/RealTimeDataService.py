from datetime import datetime, timedelta
from fastapi import HTTPException, status
from sqlmodel import   Session,select

from .RealTimeDataDTOs import DataResponseDTO, EpicStatusDTO
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

        points: list[RealTimeTicks] =list(self.session.exec(select(RealTimeTicks).where(RealTimeTicks.asset_id==asset_id).where(RealTimeTicks.timestamp>yesterday)).all())
        return DataResponseDTO(points=points)

