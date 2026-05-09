from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health_route() -> None:
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_demo_route() -> None:
    response = client.get("/demo")
    assert response.status_code == 200
    body = response.json()
    assert body["message"] == "AutoFlow backend is ready."
    assert body["active_users"] == 5
