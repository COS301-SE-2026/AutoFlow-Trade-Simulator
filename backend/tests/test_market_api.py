from fastapi.testclient import TestClient
from app.main import app

from sqlmodel import Session
from app.models.currency import Currency
from tests.conftest import test_engine

client = TestClient(app)


def get_token(email: str = "test@example.com") -> str:
    client.post("/auth/register", json={
        "email": email,
        "password": "password123",
        "full_name": "Test User"
    })
    response = client.post("/auth/login", json={
        "email": email,
        "password": "password123"
    })
    return response.json()["access_token"]


def test_prices_daily_happy_path():
    res = client.get("/market-data/assets/BTC-USDT/prices",
                     params={"timeframe": "1d"})
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)
    assert len(data) > 0
