from fastapi import APIRouter, Depends
from sqlmodel import Session
from ...core.security import get_current_user
from ...models import User

from .PortfolioDTOs import EpicStatusDTO, ExecuteTradeDTO,ExecuteTradeResponseDTO
from .PortfolioService import PortfolioService
from ...database import get_session

def get_portfolio_service(session:Session=Depends(get_session))->PortfolioService:
                         return PortfolioService(session)

router = APIRouter(prefix="/portfolio", tags=["Portfolio"])



@router.get("/status", response_model=EpicStatusDTO)
def get_epic_status() -> EpicStatusDTO:
    return PortfolioService.get_status()


@router.post("/accounts/{acount_id}", response_model=ExecuteTradeResponseDTO)
def execute_trade(data:ExecuteTradeDTO,service:PortfolioService=Depends(get_portfolio_service),current_user:User=Depends(get_current_user)) -> ExecuteTradeResponseDTO:
    return PortfolioService.execute_trade(service,data,current_user)
