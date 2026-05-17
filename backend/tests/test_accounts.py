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


def seed_currency(code: str = "ZAR") -> None:
    with Session(test_engine) as session:
        currency = Currency(code=code, name="South African rand")
        session.add(currency)
        session.commit()


def test_list_accounts() -> None:
    token = get_token()
    response = client.get(
        "/accounts", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    assert response.json() == {"accounts": []}


def test_create_account_valid_currency() -> None:
    seed_currency()
    token = get_token()
    response = client.post("/accounts", json={
        "currency_code": "ZAR",
        "initial_balance": "1000.00"
    }, headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    assert float(response.json()["balance"]) == 1000.0


def test_create_account_invalid_currency() -> None:
    seed_currency()
    token = get_token()
    response = client.post("/accounts", json={
        "currency_code": "RMB",
        "initial_balance": "1000.00"
    }, headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 400
