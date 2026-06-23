from fastapi.testclient import TestClient
from app.main import app

from sqlmodel import Session
from app.models.currency import Currency
from tests.conftest import test_engine
from app.models.asset import Asset

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

def seed_asset(ticker: str = "AAPL") -> None:
    with Session(test_engine) as session:
        asset = Asset(ticker=ticker, name="Apple Inc", asset_type="stock")
        session.add(asset)
        session.commit()
        
def seed_currency(code: str = "ZAR") -> None:
    with Session(test_engine) as session:
        currency = Currency(code=code, name="South African rand")
        session.add(currency)
        session.commit()

def test_execute_buy_trade() -> None:
    seed_asset()
    seed_currency()
    token = get_token()
    create_response = client.post("/accounts", json={
        "currency_code": "ZAR",
        "initial_balance": "1000.00"
    }, headers={"Authorization": f"Bearer {token}"})
    account_id = create_response.json()["id"]
    
    response = client.post(f"/portfolio/accounts/{account_id}", json={
        "ticker": "AAPL",
        "direction": "buy",
        "quantity": 1
    }, headers={"Authorization": f"Bearer {token}"})
    
    assert response.status_code == 200


def test_execute_sell_trade() -> None:
    seed_asset()
    seed_currency()
    token = get_token()
    create_response = client.post("/accounts", json={
        "currency_code": "ZAR",
        "initial_balance": "1000.00"
    }, headers={"Authorization": f"Bearer {token}"})
    account_id = create_response.json()["id"]
    
    # buy stock
    response_buy = client.post(f"/portfolio/accounts/{account_id}", json={
        "ticker": "AAPL",
        "direction": "buy",
        "quantity": 1
    }, headers={"Authorization": f"Bearer {token}"})
    
    # sell that stock
    response_sell = client.post(f"/portfolio/accounts/{account_id}", json={
        "ticker": "AAPL",
        "direction": "sell",
        "quantity": 1
    }, headers={"Authorization": f"Bearer {token}"})
    
    assert response_sell.status_code == 200


def test_buy_insufficient_balance() -> None:
    seed_asset()
    seed_currency()
    token = get_token()
    create_response = client.post("/accounts", json={
        "currency_code": "ZAR",
        "initial_balance": "0.00"
    }, headers={"Authorization": f"Bearer {token}"})
    account_id = create_response.json()["id"]
    
    # buy stock
    response = client.post(f"/portfolio/accounts/{account_id}", json={
        "ticker": "AAPL",
        "direction": "buy",
        "quantity": 1
    }, headers={"Authorization": f"Bearer {token}"})
        
    assert response.status_code == 400


def test_sell_more_than_owned() -> None:
    seed_asset()
    seed_currency()
    token = get_token()
    create_response = client.post("/accounts", json={
        "currency_code": "ZAR",
        "initial_balance": "1000.00"
    }, headers={"Authorization": f"Bearer {token}"})
    account_id = create_response.json()["id"]
    
    num_buy = 1
    num_sell = 2
    
    # buy stock
    response_buy = client.post(f"/portfolio/accounts/{account_id}", json={
        "ticker": "AAPL",
        "direction": "buy",
        "quantity": num_buy
    }, headers={"Authorization": f"Bearer {token}"})
    
    # sell that stock
    response_sell = client.post(f"/portfolio/accounts/{account_id}", json={
        "ticker": "AAPL",
        "direction": "sell",
        "quantity": num_sell
    }, headers={"Authorization": f"Bearer {token}"})
    
    assert response_sell.status_code == 400

