from abc import ABC, abstractmethod
from .RubricEngineDTO import EvaluationResultDTO, ExecutionMetricDTO

class BaseRubricStrategy(ABC):

    @abstractmethod
    def evaluate(self, metrics: ExecutionMetricDTO) -> EvaluationResultDTO:
        pass