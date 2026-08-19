from decimal import Decimal
from sqlmodel import SQLModel
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
    
class SymbolResponseDTO(SQLModel):
    symbols:list[str]
    count:int
