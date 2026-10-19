from sqlite3 import IntegrityError

from fastapi import HTTPException, status
from sqlmodel import Session, select
import string
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token as google_id_token
from ...core.security import create_access_token, create_password_hash, verify_password_hash
from ...models import User,Portfolio
from ...settings import settings
from .AuthDTOs import LoginResponseDTO, RegistrationDTO,LoginDTO,GoogleLoginDTO,EpicStatusDTO, RegistrationResponseDTO


class AuthService:

    ERROR_MESSAGE: str = "User ID was not generated"

    def __init__(self, session: Session):
        self.session = session

    def register(self, data: RegistrationDTO) -> RegistrationResponseDTO:
        try:
        #check if registered already
            if self.session.exec(select(User).where(User.email==data.email)).all():
                raise HTTPException(status_code=status.HTTP_409_CONFLICT,detail="Email already registered, please login")

        # check if password is valid length
            if len(data.password) < 8 :
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,detail="Password field must be 8 or more characters")
            # check if password contains a symbol

            if not any(char in string.punctuation for char in data.password):
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,detail="Password field must contain a symbol")
        # Create user
            user = User(
                email=data.email,
                full_name=data.full_name,
                password_hash=create_password_hash(data.password),
                upgrades=['strategy_basic', 'strategy_mean_reversion'],
            )
            self.session.add(user)
            self.session.flush()

            if user.id is None:
                raise ValueError(self.ERROR_MESSAGE)

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
        invalid_str = "Invalid email or password"
        if user is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,detail=invalid_str)

        if not verify_password_hash(data.password,user.password_hash):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,detail=invalid_str)

        if user.id is None:
            raise ValueError(invalid_str)

        token:str =create_access_token(user.id)
        login_response:LoginResponseDTO= LoginResponseDTO(access_token=token)
        return login_response

    def login_with_google(self, data: GoogleLoginDTO) -> LoginResponseDTO:
        try:
            claims = google_id_token.verify_oauth2_token(
                data.id_token, google_requests.Request(), settings.google_client_id
            )
        except ValueError:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid Google token")

        google_sub: str = claims["sub"]
        email: str = claims["email"]
        full_name: str = claims.get("name") or email

        try:
            user = self.session.exec(
                select(User).where(User.google_sub == google_sub)
            ).scalar_one_or_none()

            if user is None:
                user = self.session.exec(
                    select(User).where(User.email == email)
                ).scalar_one_or_none()

                if user is None:
                    user = User(email=email, full_name=full_name, google_sub=google_sub)
                    self.session.add(user)
                    self.session.flush()
                    self.session.add(
                        Portfolio(
                            user_id=user.id,
                            name=f"{user.full_name}'s portfolio",
                        )
                    )
                elif user.google_sub is None:
                    user.google_sub = google_sub
                    self.session.add(user)
                else:
                    raise HTTPException(
                        status_code=status.HTTP_409_CONFLICT,
                        detail="Email is already linked to a different Google account",
                    )

            try:
                self.session.commit()
            except IntegrityError:
                self.session.rollback()
                user = self.session.exec(
                    select(User).where(User.google_sub == google_sub)
                ).scalar_one_or_none()
                if user is None:
                    raise

            user_id: int | None = user.id
            if user_id is None:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=self.ERROR_MESSAGE,
                )

            return LoginResponseDTO(access_token=create_access_token(user_id))

        except Exception:
            self.session.rollback()
            raise

    @staticmethod
    def get_status() -> EpicStatusDTO:
        return EpicStatusDTO(
            epic="Authorisation",
            status="Healthy",
        )

