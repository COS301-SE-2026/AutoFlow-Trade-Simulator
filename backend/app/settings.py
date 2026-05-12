from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict
import os


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=(".env", "../.env"), extra="ignore")

    database_url: str
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    redis_url: str = "redis://localhost:6379/0"
    # When true, the app will call SQLModel.metadata.create_all(engine)
    # on startup so the database schema is auto-synced to the models.
    # Set to False in environments where migrations are required instead.
    auto_sync_db: bool = True


@lru_cache
def get_settings() -> Settings:
    database_url: str = os.environ["DATABASE_URL"]
    secret_key: str = os.environ["SECRET_KEY"]
    return Settings(database_url=database_url, secret_key=secret_key)


settings = get_settings()
