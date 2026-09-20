from abc import ABC, abstractmethod
from RubricEngineDTOs import EvaluationResultDTO, ExecutionMetricDTO

class BaseRubricStrategy(ABC):

    @abstractmethod
    def evaulate(self, metrics: ExecutionMetricDTO) -> EvaluationResultDTO:
        pass