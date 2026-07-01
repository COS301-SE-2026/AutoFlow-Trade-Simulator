from decimal import Decimal
from sqlmodel import Field, SQLModel

class MarketDataCache(SQLModel, table=True):
    id: int = Field(default=None, primary_key=True, autoincrement=True)
    asset_id: int = Field(primary_key=True)

    #Market data common terms
    last_price: Decimal = Field(max_digits=18, decimal_places=4, nullable=False)
    bid_price: Decimal = Field(max_digits=18, decimal_places=4, nullable=False)
    ask_price: Decimal = Field(max_digits=18, decimal_places=4, nullable=False)
    bid_size: int = Field(nullable=False)
    ask_size: int = Field(nullable=False)
    trading_status: str = Field(default="Trading", nullable=False)