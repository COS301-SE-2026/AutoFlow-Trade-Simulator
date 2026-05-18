from fastapi import APIRouter, Depends
from sqlmodel import Session
from ...core.security import get_current_user
from ...models import User

from .PortfolioDTOs import EpicStatusDTO, ExecuteTradeDTO,ExecuteTradeResponseDTO, TradeHistoryResponse
from .PortfolioService import PortfolioService
from ...database import get_session

def get_portfolio_service(session:Session=Depends(get_session))->PortfolioService:
                         return PortfolioService(session)

router = APIRouter(prefix="/portfolio", tags=["Portfolio"])



@router.get("/status", response_model=EpicStatusDTO)
def get_epic_status() -> EpicStatusDTO:
    return PortfolioService.get_status()

@router.get("/accounts/{account_id}",response_model=TradeHistoryResponse)
def get_trade_history(account_id:int,service:PortfolioService=Depends(get_portfolio_service),current_user:User=Depends(get_current_user))->TradeHistoryResponse:

    return service.get_transaction_history(account_id,current_user)


@router.post("/accounts/{account_id}", response_model=ExecuteTradeResponseDTO)
def execute_trade(data:ExecuteTradeDTO,account_id:int,service:PortfolioService=Depends(get_portfolio_service),current_user:User=Depends(get_current_user)) -> ExecuteTradeResponseDTO:
    return service.execute_trade(data,account_id,current_user)
