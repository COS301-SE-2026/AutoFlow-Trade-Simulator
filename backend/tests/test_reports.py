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

        
def test_execute_buy_trade() -> None:
    token = get_token()    
    response = client.post("reports", json={
        "period": "daily"
    }, headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200


def test_create_report_weekly() -> None:
    token = get_token()    
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


