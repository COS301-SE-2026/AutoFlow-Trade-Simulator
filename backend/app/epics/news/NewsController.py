from typing import Annotated
from fastapi import APIRouter, Depends
from sqlmodel import Session

from .NewsService import NewsService
from ...database import get_session
from .NewsDTOs import EpicStatusDTO


router=APIRouter(prefix="/news",tags=["News"])

def get_news_service(session:Annotated[Session,Depends(get_session)])->NewsService:
    return NewsService(session)

@router.get("status")
def get_epic_status()->EpicStatusDTO:
    return NewsService.get_status()
