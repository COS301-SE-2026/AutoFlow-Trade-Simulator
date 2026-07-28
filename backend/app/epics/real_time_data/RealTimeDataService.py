from sqlmodel import   Session, col, select

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
        asset_id:int|None= self.session.exec(select(Asset.asset_id).where(Asset.symbol==symbol)).one()
        if asset_id is None:
            raise ValueError(f"Asset not found for symbol: {symbol}")

        points: list[RealTimeTicks] =list(self.session.exec(select(RealTimeTicks).where(RealTimeTicks.asset_id==asset_id)).all())
        return DataResponseDTO(points=points)

