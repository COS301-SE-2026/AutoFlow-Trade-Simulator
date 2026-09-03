

from datetime import date, datetime
from ...models.transaction import Direction
from sqlmodel import SQLModel


class EpicStatusDTO(SQLModel):
    epic: str
    status: str

class ExecuteTradeDTO(SQLModel):
    ticker:str
    direction: Direction
    quantity:float

class ExecuteTradeResponseDTO(SQLModel):
    transaction_id: int
    account_id: int
    ticker: str
    direction: Direction
    quantity: float
    price_at_execution: float
    total_cost: float
    executed_at: datetime
    new_cash_balance: float
    new_position_quantity: float

class TransactionResponse(SQLModel):
    account_id:int
    account_currency_code:str
    asset_ticker:str
    asset_id:int
    direction:Direction
    quantity:float
    price_at_execution:float
    executed_at:datetime

class TradeHistoryResponse(SQLModel):
    transactions:list[TransactionResponse]

class Holding(SQLModel):
    asset_id: int
    ticker: str
    net_quantity: float
    average_cost: float 

class HoldingResponse(SQLModel):
    holdings: list[Holding]

class PortfolioHistoryPoint(SQLModel):
    date: date
    total_value: float

class PortfolioHistoryResponse(SQLModel):
    points: list[PortfolioHistoryPoint]
