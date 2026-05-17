
from datetime import datetime
from decimal import Decimal
from sqlmodel import SQLModel


class AccountResponse(SQLModel):
    id: int
    portfolio_id:int
    currency_id:int
    balance:Decimal
    created_at: datetime

class AccountListResponse(SQLModel):
    accounts: list[AccountResponse]

class CreateAcountDTO(SQLModel):
    currency_code:str
    initial_balance:Decimal

class GetAccountDTO(SQLModel):
    account_id:int
