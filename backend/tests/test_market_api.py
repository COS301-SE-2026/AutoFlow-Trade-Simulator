from fastapi.testclient import TestClient
from app.main import app


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


def test_prices_weekly_happy_path():
    res = client.get("/market-data/assets/BTC-USDT/prices",
                     params={"timeframe": "1w"})
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)
    assert len(data) > 0


def test_prices_monthly_happy_path():
    res = client.get("/market-data/assets/BTC-USDT/prices",
                     params={"timeframe": "1m"})
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)
    assert len(data) > 0


def test_prices_unknown_ticker_404():
    res = client.get("/market-data/assets/NONSENSE/prices",
                     params={"timeframe": "1m"})
    assert res.status_code == 404


def test_prices_invalid_timeframe_422():
    res = client.get("/market-data/assets/BTC-USDT/prices",
                     params={"timeframe": "NONSENSE"})
    assert res.status_code == 422


def test_summary_happy_path():
    res = client.get("/market-data/assets/BTC-USDT/summary")
    assert res.status_code == 200
    data = res.json()
    assert "ticker" in data
    assert "current_price" in data
    assert "daily_high" in data
    assert "daily_low" in data
    assert "timestamp" in data


def test_summary_unknown_ticker_404():
    res = client.get("/market-data/assets/NONSENSE/summary")
    assert res.status_code == 404
