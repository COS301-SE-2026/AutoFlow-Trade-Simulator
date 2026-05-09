from fastapi import APIRouter

from .UiDTOs import EpicStatusDTO
from .UiService import UiService

router = APIRouter(prefix="/ui", tags=["UI"])


@router.get("/status", response_model=EpicStatusDTO)
def get_epic_status() -> EpicStatusDTO:
    return UiService.get_status()
