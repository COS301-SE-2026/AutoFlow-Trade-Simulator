from fastapi import APIRouter, Depends
from sqlmodel import Session
from ..auth.AuthDTOs import EpicStatusDTO
from ...models import User
from .AccountsDTOs import AccountListResponse, AccountResponse, CreateAcountDTO
from .AccountsService import AccountsService
from ...database import get_session
from ...core.security import get_current_user

def get_accounts_service(session:Session=Depends(get_session))->AccountsService:
                         return AccountsService(session)

router= APIRouter(prefix="/accounts",tags=["Accounts"])

@router.get("/status",response_model=EpicStatusDTO)
def get_epic_status() -> EpicStatusDTO:
    return AccountsService.get_status()

@router.get("",response_model=AccountListResponse)
def get_all_accounts(service:AccountsService=Depends(get_accounts_service),current_user:User=Depends(get_current_user))->AccountListResponse:
    return service.find_all(current_user)

@router.get("/{account_id}", response_model=AccountResponse)
def get_account(account_id: int, service: AccountsService = Depends(get_accounts_service),current_user: User = Depends(get_current_user))->AccountResponse:
    return service.find_by_id(account_id, current_user)

@router.post("",response_model=AccountResponse)
def create_account(data:CreateAcountDTO,service:AccountsService=Depends(get_accounts_service),current_user:User=Depends(get_current_user)) -> AccountResponse:
    return service.create(data,current_user)

