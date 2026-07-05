from sqlmodel import Field, SQLModel
from decimal import Decimal
from datetime import datetime

class Greeks(SQLModel, table=True):
    user_id: int = Field(primary_key=True, foreign_key="user.id")
    symbol: str = Field(nullable=False)
    delta: Decimal = Field(max_digits=18, decimal_places=4, nullable=False)
    gamma: Decimal = Field(max_digits=18, decimal_places=4, nullable=False)
    theta: Decimal = Field(max_digits=18, decimal_places=4, nullable=False)
    vega: Decimal = Field(max_digits=18, decimal_places=4, nullable=False)
    rho: Decimal = Field(max_digits=18, decimal_places=4, nullable=False)
    timestamp: datetime = Field(nullable=False)