from fastapi import APIRouter

from .PortfolioDTOs import EpicStatusDTO
from .PortfolioService import PortfolioService

router = APIRouter(prefix="/portfolio", tags=["Portfolio"])


@router.get("/status", response_model=EpicStatusDTO)
def get_epic_status() -> EpicStatusDTO:
    return PortfolioService.get_status()
