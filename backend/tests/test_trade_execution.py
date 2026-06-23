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


def test_trade_wrong_account() -> None:
    seed_asset()
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
    
    # trade with mismatched token
    response = client.post(f"/portfolio/accounts/{account_id_1}", json={
        "ticker": "AAPL",
        "direction": "buy",
        "quantity": 1
    }, headers={"Authorization": f"Bearer {token_2}"})
    assert response.status_code == 403


def test_get_transaction_history() -> None:
    seed_asset()
    seed_currency()
    token = get_token()
    create_response = client.post("/accounts", json={
        "currency_code": "ZAR",
        "initial_balance": "1000.00"
    }, headers={"Authorization": f"Bearer {token}"})
    account_id = create_response.json()["id"]
    
    response = client.get(f"/portfolio/accounts/{account_id}/transactions", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200


def test_get_holdings_after_buy() -> None:
    seed_asset()
    seed_currency()
    token = get_token()
    create_response = client.post("/accounts", json={
        "currency_code": "ZAR",
        "initial_balance": "1000.00"
    }, headers={"Authorization": f"Bearer {token}"})
    account_id = create_response.json()["id"]
    
    # quantity before buy
    response_before_buy = client.get(f"/portfolio/accounts/{account_id}/holdings", headers={"Authorization": f"Bearer {token}"})
    holdings_before = response_before_buy.json()["holdings"]
    net_quantity_before = holdings_before[0]["net_quantity"] if holdings_before else 0
    
    response_buy = client.post(f"/portfolio/accounts/{account_id}", json={
        "ticker": "AAPL",
        "direction": "buy",
        "quantity": 1
    }, headers={"Authorization": f"Bearer {token}"})
    
    # quantity after buying 1
    response_after_buy = client.get(f"/portfolio/accounts/{account_id}/holdings", headers={"Authorization": f"Bearer {token}"})
    holdings_after = response_after_buy.json()["holdings"]
    net_quantity_after = holdings_after[0]["net_quantity"] if holdings_after else 0
    
    assert net_quantity_before == 0
    assert net_quantity_after == 1