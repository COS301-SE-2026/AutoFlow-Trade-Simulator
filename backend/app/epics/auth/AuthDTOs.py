from sqlmodel import SQLModel
from pydantic import EmailStr


class RegistrationDTO(SQLModel):
    email: EmailStr
    password: str
    full_name:str


class LoginDTO(SQLModel):
    email: EmailStr
    password:str

class GoogleLoginDTO(SQLModel):
    id_token: str

class EpicStatusDTO(SQLModel):
    epic: str
    status: str

class LoginResponseDTO(SQLModel):
    access_token: str
    token_type: str = "bearer"

class RegistrationResponseDTO(SQLModel):
    access_token: str
    token_type: str = "bearer"
