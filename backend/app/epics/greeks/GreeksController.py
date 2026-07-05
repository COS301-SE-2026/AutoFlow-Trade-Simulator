from fastapi import APIRouter
from .GreeksDTOs import EpicStatusDTO,GreekValues
from .GreeksService import GreeksService
router= APIRouter(prefix="/greeks",tags=["Greeks"])

@router.get("/status", response_model=EpicStatusDTO)
def get_epic_status() -> EpicStatusDTO:
    return GreeksService.get_status()


@router.get("{symbol}")
def get_greeks(symbol:str)->GreekValues:
    return GreeksService.get_greeks()

