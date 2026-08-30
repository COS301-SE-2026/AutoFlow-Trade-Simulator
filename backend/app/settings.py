from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


BASE_DIR = Path(__file__).resolve().parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore",
    )

    database_url: str
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    redis_url: str = "redis://localhost:6379/0"
    # When true, the app will call SQLModel.metadata.create_all(engine)
    # on startup so the database schema is auto-synced to the models.
    # Set to False in environments where migrations are required instead.
    auto_sync_db: bool = True

    db_pool_pre_ping: bool = True
    db_pool_recycle: int = 1800  # recycle connections every 30 minutes to refresh the AWS DNS cache
    db_pool_size: int = 10
    db_max_overflow: int = 20


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
