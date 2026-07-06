from datetime import datetime
from decimal import Decimal
from typing import Optional
from sqlmodel import SQLModel

class CacheMarketDataDTO(SQLModel):
    asset_id: int
    last_price: Decimal
    bid_price: Decimal
    ask_price: Decimal
    bid_size: int
    ask_size: int
    total_volume: int
    open_price: Decimal
    high_price: Decimal
    low_price: Decimal
    exchange_timestamp: datetime
    official_close: Optional[Decimal] = None
    trading_status: str = "Trading"