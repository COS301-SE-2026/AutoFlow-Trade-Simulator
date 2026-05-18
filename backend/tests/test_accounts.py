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


def test_get_own_account() -> None:
    seed_currency()
    token = get_token()
    create_response = client.post("/accounts", json={
        "currency_code": "ZAR",
        "initial_balance": "1000.00"
    }, headers={"Authorization": f"Bearer {token}"})
    account_id = create_response.json()["id"]
    response = client.get(
        f"/accounts/{account_id}", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200


def test_get_other_users_account() -> None:
    seed_currency()
    token_1 = get_token("test_user_number_1@email.com")
    token_2 = get_token("test_user_number_2@email.com")

    create_response_1 = client.post("/accounts", json={
        "currency_code": "ZAR",
        "initial_balance": "1000.00"
    }, headers={"Authorization": f"Bearer {token_1}"})
    account_id_1 = create_response_1.json()["id"]

    create_response_2 = client.post("/accounts", json={
        "currency_code": "ZAR",
        "initial_balance": "1000.00"
    }, headers={"Authorization": f"Bearer {token_2}"})
    account_id_2 = create_response_2.json()["id"]

    # try get the id of account 1 using the token of account 2
    response = client.get(
        f"/accounts/{account_id_1}", headers={"Authorization": f"Bearer {token_2}"})
    assert response.status_code == 403
