from abc import ABC, abstractmethod
from .RubricEngineDTO import EvaluationResultDTO, ExecutionMetricDTO, Grade

class BaseRubricStrategy(ABC):

    @abstractmethod
    def evaluate(self, metrics: ExecutionMetricDTO) -> EvaluationResultDTO:
        pass

    def _compute_grade(self, score: float) -> Grade:
        if score >= 90.0:
            return Grade.S
        if score >= 80.0:
            return Grade.A
        if score >= 70.0:
            return Grade.B
        if score >= 60.0:
            return Grade.C
        if score >= 50.0:
            return Grade.D
        if score >= 40.0:
            return Grade.E
        return Grade.F
