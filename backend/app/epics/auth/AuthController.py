
from fastapi import APIRouter, Depends
from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel import Session

from .AuthDTOs import EpicStatusDTO, GoogleLoginDTO, LoginDTO, LoginResponseDTO, RegistrationDTO, RegistrationResponseDTO
from .AuthService import AuthService
from ...database import get_session

def get_auth_service(session: Session = Depends(get_session)) -> AuthService:
    return AuthService(session)

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.get("/status", response_model=EpicStatusDTO)
def get_epic_status() -> EpicStatusDTO:
    return AuthService.get_status()

@router.post("/login",response_model=LoginResponseDTO)
def login(data:LoginDTO, service:AuthService=Depends(get_auth_service)) -> LoginResponseDTO:
    return service.login(data=data)

@router.post("/login/swagger", include_in_schema=False)
def login_swagger(
    form_data: OAuth2PasswordRequestForm  = Depends(),
    service: AuthService = Depends(get_auth_service)
):
    return service.login(LoginDTO(email=form_data.username, password=form_data.password))

@router.post("/google")
def login_with_google(data:GoogleLoginDTO, service:AuthService=Depends(get_auth_service)) -> LoginResponseDTO:
    return service.login_with_google(data=data)

@router.post("/register",response_model=RegistrationResponseDTO)
def register(data:RegistrationDTO, service:AuthService=Depends(get_auth_service)) -> RegistrationResponseDTO:
    return service.register(data=data)
