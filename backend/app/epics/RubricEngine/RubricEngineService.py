from typing import Dict
from sqlmodel import Session
from fastapi import HTTPException, status
from .RubricDTO import EpicStatusDTO, EvaluationResultDTO, ExecutionMetricDTO
from .base_strategy import BaseRubricStrategy
from .mean_reversion_strategy import MeanReversionStrategy

class RubricEngineService:

    def __init__(self, session: Session):
        self.session = session
        self._strategies: Dict[str, BaseRubricStrategy] = {
            "mean_reversion": MeanReversionStrategy()
        }

    def get_status(self) -> EpicStatusDTO:
        return EpicStatusDTO(
            epic="Rubric Engine", status="Service Operational"
        )
    
    def evaluate_strategy(self, strat_key: str, metrics: ExecutionMetricDTO) -> EvaluationResultDTO:
        strategy = self._strategies.get(strat_key)
        if not strategy:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Strategy '{strat_key}' is not supported")

        result = strategy.evaluate(metrics)

        return result