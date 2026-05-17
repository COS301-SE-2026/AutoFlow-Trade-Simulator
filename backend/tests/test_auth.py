from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_register_success() -> None:
    response = client.post("/auth/register", json={
        "email": "test@example.com",
        "password": "password123",
        "full_name": "Test User"
    })
    assert response.status_code == 200
    assert "access_token" in response.json()