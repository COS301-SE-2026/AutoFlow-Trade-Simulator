from typing import Annotated

from fastapi import APIRouter, Depends
from sqlmodel import Session

from .PuzzleService import PuzzleService
from .PuzzleDTOs import PuzzleStartRequest, PuzzleSubmitRequest, PuzzleSubmitResponse

from ...core.security import get_current_user
from ...database import get_session
from ...models.user import User


def get_puzzle_service(session: Annotated[Session, Depends(get_session)]) -> PuzzleService:
    return PuzzleService(session)

router = APIRouter(prefix="/puzzle", tags=["Puzzle"])


@router.post("/start")
def get_puzzle_data (
    req: PuzzleStartRequest,
    service: Annotated[PuzzleService,
    Depends(get_puzzle_service)],
    user: Annotated[User, Depends(get_current_user)]
)  :
    return service.get_puzzle(req.asset,user.id,req.strategy_id)


@router.post("/{puzzle_id}/submit", response_model=PuzzleSubmitResponse)
def submit_puzzle (
    puzzle_id: int,
    req: PuzzleSubmitRequest,
    service: Annotated[PuzzleService, Depends(get_puzzle_service)],
    user: Annotated[User, Depends(get_current_user)]
):
    return service.submit_puzzle(puzzle_id, user.id, req.actions)
