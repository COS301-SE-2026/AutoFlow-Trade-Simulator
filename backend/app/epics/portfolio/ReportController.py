from typing import List, Literal
from fastapi import APIRouter, Depends, status, Body
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
    period: str = Body(..., embed=True),
    db: Session = Depends(get_session),
    user_id: int = Annotated[User, Depends(get_current_user)],
    service: ReportGenService = Depends()
) -> Report:
    return service.generate_report(user_id=user_id, period_string=period, db=db)


@router.get("/", response_model=List[ReportSection])
def get_report_history(
    db: Session = Depends(get_session),
    user_id: int = Annotated[User, Depends(get_current_user)],
    service: ReportGenService = Depends()
) -> List[ReportSection]:
    return service.get_user_report_history(user_id=user_id, db=db)