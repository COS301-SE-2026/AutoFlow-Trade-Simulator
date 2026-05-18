

from datetime import datetime
from decimal import Decimal
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
    price_at_execution: Decimal
    total_cost: Decimal
    executed_at: datetime
    new_cash_balance: Decimal
    new_position_quantity: float

class TransactionResponse(SQLModel):
    account_id:int
    account_currency_code:str
    asset_ticker:str
    asset_id:int
    direction:Direction
    quantity:float
    price_at_execution:Decimal
    executed_at:datetime

class TradeHistoryResponse(SQLModel):
    transactions:list[TransactionResponse]
