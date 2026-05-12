from datetime import datetime, timedelta, timezone
from jose import jwt
from sqlmodel import Session
from ..models.user import User
from ..database import get_session

from ..settings import settings
from passlib.hash import bcrypt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

def create_password_hash(password:str)-> str:
    return bcrypt.hash(password)

def verify_password_hash(password:str,password_hash:str)->bool:
    return bcrypt.verify(password,password_hash)



def create_access_token(subject: int, expire_minutes: int | None = None) -> str:
    expire_delta = timedelta(minutes=expire_minutes or settings.access_token_expire_minutes)
    expire = datetime.now(timezone.utc) + expire_delta
    payload = {"sub": str(subject), "exp": expire}
    return jwt.encode(payload, settings.secret_key, algorithm=settings.algorithm)


def decode_access_token(token: str) -> dict:
    return jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])

def get_current_user(token: str = Depends(oauth2_scheme),session:Session = Depends(get_session)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = decode_access_token(token)
        user_id_raw: str|None = payload.get('sub')
        if user_id_raw is None:
            raise credentials_exception
        user_id:int= int(user_id_raw)

    except (JWTError,ValueError):
        raise credentials_exception

    # fetch user from db

    user:User|None =session.get(User,user_id)

    if user is None:
        raise credentials_exception

    return user

