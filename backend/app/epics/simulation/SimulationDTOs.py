from sqlmodel import  SQLModel
from ...models.strategies import Strategies
class EpicStatusDTO(SQLModel):
    epic: str
    status: str

class StrategiesResponse(SQLModel):
    strategies: list[Strategies]
