from typing import List, Literal, Annotated
from fastapi import APIRouter, Depends, status, Body, HTTPException
from pydantic import BaseModel
from sqlmodel import Session

from ...database import get_session
from app.models.report import Report, Period
from app.models.report_section import ReportSection
from .ReportService import ReportGenService
from ...core.security import get_current_user
from ...models import User

router = APIRouter(prefix="/reports", tags=["Reports"])

@router.post("/")
def create_report(
    current_user: Annotated[User, Depends(get_current_user)],
    period: Annotated[str, Body(..., embed=True)], 
    db: Annotated[Session, Depends(get_session)],  
    service: Annotated[ReportGenService, Depends()]
) -> ReportSection: 
    if current_user.id is None:
        raise HTTPException(status_code=401, detail="Invalid Identity")

    return service.generate_report(user_id=current_user.id, period_string=period, db=db)


@router.get("/")
def get_report_history(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_session)], 
    service: Annotated[ReportGenService, Depends()]
) -> List[ReportSection]:  
    if current_user.id is None:
        raise HTTPException(status_code=401, detail="Invalid user authentication identity.")

    return service.get_user_report_history(user_id=current_user.id, db=db)