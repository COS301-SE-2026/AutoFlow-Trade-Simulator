from decimal import Decimal

from sqlmodel import Session, select

from tests.conftest import client, get_token, test_engine
from app.models.asset import Asset
from app.models.portfolio import Portfolio
from app.models.international_account import InternationalAccount
from app.models.currency import Currency
from app.models.transaction import Transaction, Direction
from app.models.user import User


def _give_user_a_trade(email: str) -> None:
    with Session(test_engine) as session:
        user = session.exec(select(User).where(User.email == email)).first()
        assert user is not None
        portfolio = session.exec(select(Portfolio).where(Portfolio.user_id == user.id)).first()
        assert portfolio is not None
        asset = session.exec(select(Asset).where(Asset.symbol == "AAPL")).first()
        assert asset is not None
        currency = session.exec(select(Currency)).first()
        if currency is None:
            currency = Currency(code="ZAR", name="South African Rand")
            session.add(currency)
            session.flush()

        account = InternationalAccount(portfolio_id=portfolio.id, currency_id=currency.id, balance=Decimal("10000"))
        session.add(account)
        session.flush()

        session.add(Transaction(
            account_id=account.id,
            asset_id=asset.asset_id,
            direction=Direction.Buy,
            quantity=1,
            price_at_execution=Decimal("150.0"),
        ))
        session.commit()


def test_create_report_daily() -> None:
    token = get_token()
    _give_user_a_trade("test@example.com")
    response = client.post("reports", json={
        "period": "daily"
    }, headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200


def test_create_report_weekly() -> None:
    token = get_token()
    _give_user_a_trade("test@example.com")
    response = client.post("reports", json={
        "period": "weekly"
    }, headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200


def test_create_report_invalid_period() -> None:
    token = get_token()    
    response = client.post("reports", json={
        "period": "someNonsense"
    }, headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 422


def test_get_report_history() -> None:
    token = get_token()    
    response = client.get("reports", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200


def test_report_requires_auth() -> None:
    response = client.get("reports")
    assert response.status_code == 401
