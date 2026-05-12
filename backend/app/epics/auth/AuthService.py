from fastapi import HTTPException, status
from sqlmodel import Session, select

from ...core.security import create_access_token, create_password_hash, verify_password_hash
from ...models import User,Portfolio
from .AuthDTOs import LoginResponseDTO, RegistrationDTO,LoginDTO,EpicStatusDTO, RegistrationResponseDTO


class AuthService:
    def __init__(self, session: Session):
        self.session = session

    def register(self, data: RegistrationDTO) -> RegistrationResponseDTO:
        try:
        #check if registered already
            if self.session.exec(select(User).where(User.email==data.email)).all():
                raise HTTPException(status_code=status.HTTP_409_CONFLICT,detail="Email already registered, please login")
        # Create user
            user = User(email=data.email,full_name=data.full_name,password_hash=create_password_hash(data.password))
            self.session.add(user)
            self.session.flush()

            if user.id is None:
                raise ValueError("User ID was not generated")

        # Create portfolio
            portfolio = Portfolio(
                user_id=user.id,
                name=f"{user.full_name}'s portfolio",
            )
            self.session.add(portfolio)

            self.session.commit()

            token:str = create_access_token(user.id)
            return RegistrationResponseDTO(access_token=token)

        except Exception:
            self.session.rollback()
            raise

    def login(self,data:LoginDTO)-> LoginResponseDTO:
        statement = select(User).where(User.email==data.email)
        user:User|None = self.session.exec(statement).first()
        if user is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,detail="Invalid email or password")

        if not verify_password_hash(data.password,user.password_hash):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,detail="Invalid email or password")

        if user.id is None:
            raise ValueError("Invalid email or password")

        token:str =create_access_token(user.id)
        login_response:LoginResponseDTO= LoginResponseDTO(access_token=token)
        return login_response

    @staticmethod
    def get_status() -> EpicStatusDTO:
        return EpicStatusDTO(
            epic="portfolio",
            status="Healthy",
        )

