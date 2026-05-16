from fastapi import APIRouter, Depends
from sqlmodel import Session
from backend.app.epics.auth.AuthDTOs import EpicStatusDTO
from backend.app.models.user import User
from .AccountsDTOs import AccountListResponse
from .AccountsService import AccountsService
from backend.app.database import get_session
from ...core.security import get_current_user

def get_accounts_service(session:Session=Depends(get_session))->AccountsService:
                         return AccountsService(session)

router= APIRouter(prefix="/accounts",tags=["Accounts"])

@router.get("/status",response_model=EpicStatusDTO)
def get_epic_status() -> EpicStatusDTO:
    return AccountsService.get_status()

@router.get("",response_model=AccountListResponse)
def get_all_accounts(service:AccountsService=Depends(get_accounts_service),current_user:User=Depends(get_current_user)):
    return service.find_all(current_user)

