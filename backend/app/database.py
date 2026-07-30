from collections.abc import Generator

from sqlmodel import Session, create_engine

from .settings import settings

engine = create_engine(
    settings.database_url,
    pool_pre_ping=settings.db_pool_pre_ping,
    pool_recycle=settings.db_pool_recycle,
    pool_size=settings.db_pool_size,
    max_overflow=settings.db_max_overflow,
)


def get_session() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session