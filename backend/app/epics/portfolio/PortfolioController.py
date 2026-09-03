
from fastapi import APIRouter, Depends
from sqlmodel import Session
from typing import Annotated
from ...core.security import get_current_user
from ...models import User

from .PortfolioDTOs import EpicStatusDTO, ExecuteTradeDTO, ExecuteTradeResponseDTO, TradeHistoryResponse, HoldingResponse, PortfolioHistoryResponse
from .PortfolioService import PortfolioService
from ...database import get_session


def get_portfolio_service(session: Annotated[Session, Depends(get_session)]) -> PortfolioService:
    return PortfolioService(session)


router = APIRouter(prefix="/portfolio", tags=["Portfolio"])



@router.get("/status")
def get_epic_status() -> EpicStatusDTO:
    return PortfolioService.get_status()


@router.get("/accounts/{account_id}/transactions")
def get_trade_history(
    account_id: int,
    service: Annotated[PortfolioService, Depends(get_portfolio_service)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> TradeHistoryResponse:

    return service.get_transaction_history(account_id, current_user)


@router.post("/accounts/{account_id}")
def execute_trade(
    data: ExecuteTradeDTO,
    account_id: int,
    service: Annotated[PortfolioService, Depends(get_portfolio_service)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> ExecuteTradeResponseDTO:
    return service.execute_trade(data, account_id, current_user)


@router.get("/accounts/{account_id}/holdings")
def get_holdings(
    account_id: int,
    service: Annotated[PortfolioService, Depends(get_portfolio_service)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> HoldingResponse:
    return service.get_holdings(account_id, current_user)


@router.get("/accounts/{account_id}/history")
def get_portfolio_history(
    account_id: int,
    service: Annotated[PortfolioService, Depends(get_portfolio_service)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> PortfolioHistoryResponse:
    return service.get_portfolio_history(account_id, current_user)
