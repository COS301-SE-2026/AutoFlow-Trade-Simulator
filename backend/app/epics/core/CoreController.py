from fastapi import APIRouter

from .CoreDTOs import DemoResponseDTO
from .CoreService import CoreService

router = APIRouter(tags=["Core"])


@router.get("/health")
def health() -> dict[str, str]:
    return CoreService.get_health()


@router.get("/demo", response_model=DemoResponseDTO)
def demo() -> DemoResponseDTO:
    return CoreService.get_demo()
