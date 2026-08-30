from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session
from ...core.security import get_current_user
from ...models.user import User
from .NewsService import NewsService
from ...database import get_session
from .NewsDTOs import EpicStatusDTO, NewsRepsonse, NewsRequest
from ...models.news import News


router=APIRouter(prefix="/news",tags=["News"])
auth_error="User not authenticated"

def get_news_service(session:Annotated[Session,Depends(get_session)])->NewsService:
    return NewsService(session)

@router.get("/status")
def get_epic_status()->EpicStatusDTO:
    return NewsService.get_status()

@router.post(
    "/create",
    responses={
        401: {"description":auth_error},
    }
)
def create_news(req:News,service:Annotated[NewsService, Depends(get_news_service)],current_user:Annotated[User,Depends(get_current_user)])->News  :
    if current_user.id is None:
        raise HTTPException(status_code=401, detail=auth_error)
    return service.create_news(req)

@router.post(
    "",
    responses={
        401: {"description":auth_error},
    }
)
def find_news(req:NewsRequest,service:Annotated[NewsService, Depends(get_news_service)],current_user:Annotated[User,Depends(get_current_user)])->NewsRepsonse  :
    if current_user.id is None:
        raise HTTPException(status_code=401, detail=auth_error)
    return service.find_news(req)
