from typing import Annotated

from fastapi import APIRouter, Depends
from sqlmodel import Session

from ...core.security import get_current_user
from ...database import get_session
from ...models.user import User
from .TechTreeDTOs import (
    EpicStatusDTO,
    PurchaseRequestDTO,
    PurchaseResponseDTO,
    TechTreeResponseDTO,
    UnlockCheckDTO,
)
from .TechTreeService import TechTreeService

router = APIRouter(prefix="/tech_tree", tags=["Tech Tree"])


def get_tech_tree_service(
    session: Annotated[Session, Depends(get_session)],
) -> TechTreeService:
    return TechTreeService(session)


@router.get("/status")
def get_status(
    service: Annotated[TechTreeService, Depends(get_tech_tree_service)],
) -> EpicStatusDTO:
    return service.get_status()


@router.get("/tree")
def get_tree(
    service: Annotated[TechTreeService, Depends(get_tech_tree_service)],
    user: Annotated[User, Depends(get_current_user)],
) -> TechTreeResponseDTO:
    return service.get_tree(user)


@router.get("/unlocked/{tech_name}")
def check_unlock(
    tech_name: str,
    service: Annotated[TechTreeService, Depends(get_tech_tree_service)],
    user: Annotated[User, Depends(get_current_user)],
) -> UnlockCheckDTO:
    return service.check_unlock(user, tech_name)


@router.post("/purchase")
def purchase_tech(
    request: PurchaseRequestDTO,
    service: Annotated[TechTreeService, Depends(get_tech_tree_service)],
    user: Annotated[User, Depends(get_current_user)],
) -> PurchaseResponseDTO:
    return service.purchase_tech(user, request.tech_name)