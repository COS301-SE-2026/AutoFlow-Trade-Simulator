
from sqlmodel import Session, select

from ...models.strategies import Strategies
from .SimulationDTOs import StrategiesResponse, EpicStatusDTO


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

