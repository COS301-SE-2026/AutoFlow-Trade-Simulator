from typing import List, Literal
from fastapi import APIRouter, Depends, status, Body
from pydantic import BaseModel
from sqlmodel import Session

from ...database import get_session
from app.models.report import Report, Period
from .ReportService import ReportGenService

router = APIRouter(prefix="/reports", tags=["Reports"])

@router.post("/", response_model=Report)
def create_report(
    period: str = Body(..., embed=True),
    db: Session = Depends(get_session),
    user_id: int = 1,
    service: ReportGenService = Depends()
) -> Report:
    return service.generate_report(user_id=user_id, period_string=period, db=db)


@router.get("/", response_model=List[Report])
def get_report_history(
    db: Session = Depends(get_session),
    user_id: int = 1,
    service: ReportGenService = Depends()
) -> List[Report]:
    return service.get_user_report_history(user_id=user_id, db=db)