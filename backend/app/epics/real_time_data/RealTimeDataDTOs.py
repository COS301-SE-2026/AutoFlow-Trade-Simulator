
from sqlmodel import SQLModel
from ...models.real_time_ticks import RealTimeTicks


class DataResponseDTO(SQLModel):
    points:list[RealTimeTicks]

class EpicStatusDTO(SQLModel):
    epic: str
    status: str
    