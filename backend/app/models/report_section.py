from decimal import Decimal
from typing import Optional
from sqlmodel import Field, SQLModel

class ReportSection(SQLModel, table = True):
    id:Optional[int] = Field(default=None,primary_key=True)
    report_id: int = Field(foreign_key="report.id", index=True)
    ticker: str = Field(default=None)
    open_price: Decimal = Field(default=None, max_digits=18, decimal_places=4)
    close_price: Decimal = Field(default=None, max_digits=18, decimal_places=4)
    pct_change: float = Field(default=None)
    period_high: Decimal = Field(default=None, max_digits=18, decimal_places=4)
    period_low: Decimal = Field(default=None, max_digits=18, decimal_places=4)
    #decimal(18, 4) The king of showing currency in a db schema is back