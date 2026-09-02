from datetime import datetime, timezone
from decimal import Decimal
from sqlmodel import Session, select
from app.models.currency import Currency
from app.models.asset import Asset
from app.models.real_time_ticks import RealTimeTicks
from tests.conftest import test_engine, client, get_token

from tests.conftest import client, get_token
        
def seed_currency(code: str = "ZAR") -> None:
    with Session(test_engine) as session:
        currency = Currency(code=code, name="South African rand")
        session.add(currency)
        session.commit()
        
def seed_tick(symbol: str = "AAPL", price: str = "10000.00") -> None:
    with Session(test_engine) as session:
        asset = session.exec(select(Asset).where(Asset.symbol == symbol)).first()
        assert asset is not None, f"{symbol} already exists"
        assert asset.asset_id is not None, f"{symbol} already exists"
        session.add(RealTimeTicks(
            asset_id=asset.asset_id,
            timestamp=datetime.now(timezone.utc),
            price=Decimal(price),
            volume=Decimal("10.00")
        ))
        session.commit()
        
def create_trade_setup(email: str = "test@example.com"):
    seed_currency()
    seed_tick()
    token = get_token(email)
    create_response = client.post("/accounts", json={
        "currency_code": "ZAR",
        "initial_balance": "100000.00"
    }, headers={"Authorization": f"Bearer {token}"})
    account_id = create_response.json()["id"]
    return token, account_id


def test_execute_buy_trade() -> None:
    token, account_id = create_trade_setup()
    
    response = client.post(f"/portfolio/accounts/{account_id}", json={
        "ticker": "AAPL",
        "direction": "buy",
        "quantity": 1
    }, headers={"Authorization": f"Bearer {token}"})
    
    print(f"\nresonnse status: {response.status_code}")
    print(f"\nresonnse body: {response.json()}")
    
    assert response.status_code == 200


def test_execute_sell_trade() -> None:
    token, account_id = create_trade_setup()
    
    # buy stock
    client.post(f"/portfolio/accounts/{account_id}", json={
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
    token, account_id = create_trade_setup()
    
    # buy stock
    response = client.post(f"/portfolio/accounts/{account_id}", json={
        "ticker": "AAPL",
        "direction": "buy",
        "quantity": 999999999
    }, headers={"Authorization": f"Bearer {token}"})
        
    assert response.status_code == 400


def test_sell_more_than_owned() -> None:
    token, account_id = create_trade_setup()
    
    num_buy = 1
    num_sell = 2
    
    # buy stock
    client.post(f"/portfolio/accounts/{account_id}", json={
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
    
    assert num_sell > num_buy
    assert response_sell.status_code == 400


def test_trade_wrong_account() -> None:
    seed_currency()
    seed_tick()

    token_1 = get_token("test_user_number_1@email.com")
    token_2 = get_token("test_user_number_2@email.com")

    create_response_1 = client.post("/accounts", json={
        "currency_code": "ZAR",
        "initial_balance": "1000.00"
    }, headers={"Authorization": f"Bearer {token_1}"})
    account_id_1 = create_response_1.json()["id"]

    client.post("/accounts", json={
        "currency_code": "ZAR",
        "initial_balance": "1000.00"
    }, headers={"Authorization": f"Bearer {token_2}"})
    
    # trade with mismatched token
    response = client.post(f"/portfolio/accounts/{account_id_1}", json={
        "ticker": "AAPL",
        "direction": "buy",
        "quantity": 1
    }, headers={"Authorization": f"Bearer {token_2}"})
    assert response.status_code == 403


def test_get_transaction_history() -> None:
    token, account_id = create_trade_setup()
    
    response = client.get(f"/portfolio/accounts/{account_id}/transactions", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200


def test_get_holdings_after_buy() -> None:
    token, account_id = create_trade_setup()
    
    # quantity before buy
    response_before_buy = client.get(f"/portfolio/accounts/{account_id}/holdings", headers={"Authorization": f"Bearer {token}"})
    holdings_before = response_before_buy.json()["holdings"]
    net_quantity_before = holdings_before[0]["net_quantity"] if holdings_before else 0
    
    client.post(f"/portfolio/accounts/{account_id}", json={
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