from collections.abc import Generator

from sqlmodel import Session, create_engine

from .settings import settings

engine = create_engine(settings.database_url)


def get_session() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session
