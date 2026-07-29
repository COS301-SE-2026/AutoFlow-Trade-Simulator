from decimal import Decimal
from sqlmodel import SQLModel
from ...models.real_time_ticks import RealTimeTicks
from datetime import datetime

class DataPoint(SQLModel):
    timestamp:datetime
    price:Decimal
    volume:Decimal

class DataResponseDTO(SQLModel):
    points:list[DataPoint]

class EpicStatusDTO(SQLModel):
    epic: str
    status: str
    
