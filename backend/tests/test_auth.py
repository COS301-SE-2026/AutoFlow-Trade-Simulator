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


def test_register_duplicate_email() -> None:
    client.post("/auth/register", json={
        "email": "test@example.com",
        "password": "password123",
        "full_name": "Test User"
    })
    response = client.post("/auth/register", json={
        "email": "test@example.com",
        "password": "password123",
        "full_name": "Test User"
    })
    assert response.status_code == 409


def test_register_short_password() -> None:
    response = client.post("/auth/register", json={
        "email": "test@example.com",
        "password": "e",
        "full_name": "Test User"
    })
    assert response.status_code == 400


def test_login_success() -> None:
    client.post("/auth/register", json={
        "email": "user@example.com",
        "password": "password123",
        "full_name": "Test User"
    })
    response = client.post("/auth/login", json={
        "email": "user@example.com",
        "password": "password123"
    })
    assert response.status_code == 200
    assert "access_token" in response.json()

def test_login_wrong_password() -> None:
    client.post("/auth/register", json={
        "email": "user@example.com",
        "password": "password123",
        "full_name": "Test User"
    })
    response = client.post("/auth/login", json={
        "email": "user@example.com",
        "password": "differentPassword123"
    })
    assert response.status_code == 401
