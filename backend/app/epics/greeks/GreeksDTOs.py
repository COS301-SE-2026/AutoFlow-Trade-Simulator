
from sqlmodel import SQLModel


class EpicStatusDTO(SQLModel):
    epic: str
    status: str

class GreekValues(SQLModel):
    delta: float
    gamma: float
    theta: float
    vega: float
    rho: float
