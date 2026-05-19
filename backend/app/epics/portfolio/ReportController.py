from typing import List, Literal
from fastapi import APIRouter, Depends, status, Body, HTTPException
from pydantic import BaseModel
from sqlmodel import Session
from typing import Annotated

from ...database import get_session
from app.models.report import Report, Period
from app.models.report_section import ReportSection
from .ReportService import ReportGenService
from ...core.security import get_current_user
from ...models import User

router = APIRouter(prefix="/reports", tags=["Reports"])


@router.post("/", response_model=ReportSection)
def create_report(
    current_user: Annotated[User, Depends(get_current_user)],
    period: str = Body(..., embed=True),
    db: Session = Depends(get_session),
    service: ReportGenService = Depends()
) -> ReportSection:
    if current_user.id is None:
        raise HTTPException(status_code=401, detail="Invalid Identity")

    return service.generate_report(user_id=current_user.id, period_string=period, db=db)


@router.get("/", response_model=List[ReportSection])
def get_report_history(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_session),
    service: ReportGenService = Depends()
) -> List[ReportSection]:
    if current_user.id is None:
        raise HTTPException(status_code=401, detail="Invalid user authentication identity.")

    return service.get_user_report_history(user_id=current_user.id, db=db)