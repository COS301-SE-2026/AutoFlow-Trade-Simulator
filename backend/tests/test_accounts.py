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


def test_list_accounts() -> None:
    token = get_token()
    response = client.get(
        "/accounts", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    assert response.json() == {"accounts": []}
