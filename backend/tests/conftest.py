import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

#these have to be here because they must run before the import.
os.environ["APP_ENV"] = "test"
os.environ["DATABASE_URL"] = "sqlite:///./test.db"
os.environ["SECRET_KEY"] = "test-secret"
os.environ["ALGORITHM"] = "HS256"
os.environ["ACCESS_TOKEN_EXPIRE_MINUTES"] = "30"
os.environ["REDIS_URL"] = "redis://localhost:6379/0"

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from sqlmodel import SQLModel, Session, create_engine  # noqa: E402

from app.database import get_session  # noqa: E402
from app.main import app  # noqa: E402

from app.models import User, Portfolio, Asset, Transaction  # <--- ADD THIS LINE

test_engine = create_engine("sqlite:///./test.db", connect_args={"check_same_thread": False})

def get_test_session():
    with Session(test_engine) as session:
        yield session

app.dependency_overrides[get_session] = get_test_session

@pytest.fixture(autouse=True)
def setup_database():
    SQLModel.metadata.create_all(test_engine)
    
    with Session(test_engine) as session:
        assets = [
            Asset(symbol="AAPL", asset_class="Stock", exchange="NASDAQ", currency="USD"),
        ]
        for asset in assets:
            session.add(asset)
        session.flush()

    yield
client = TestClient(app)

def get_token(email: str = "test@example.com") -> str:
    client.post("/auth/register", json={
        "email": email,
        "password": "Password123!",
        "full_name": "Test User"
    })
    response = client.post("/auth/login", json={
        "email": email,
        "password": "Password123!"
    })
    return response.json()["access_token"]