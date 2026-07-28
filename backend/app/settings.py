
from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


BASE_DIR = Path(__file__).resolve().parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(".env", ".env.test"),
        extra="ignore",
    )

    database_url: str
    secret_key: str
    algorithm: str = "A256GCM"
    access_token_expire_minutes: int = 30
    redis_url: str = "redis://localhost:6379/0"
    # When true, the app will call SQLModel.metadata.create_all(engine)
    # on startup so the database schema is auto-synced to the models.
    # Set to False in environments where migrations are required instead.
    auto_sync_db: bool = True


@lru_cache
def get_settings() -> Settings:
    return Settings()



settings = get_settings()
