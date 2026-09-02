from tests.conftest import client, get_token
        
def test_create_report_daily() -> None:
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


def test_get_report_history() -> None:
    token = get_token()    
    response = client.get("reports", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200


def test_report_requires_auth() -> None:
    response = client.get("reports")
    assert response.status_code == 401
