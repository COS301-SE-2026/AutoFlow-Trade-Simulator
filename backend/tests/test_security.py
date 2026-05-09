from app.security import create_access_token, decode_access_token


def test_create_and_decode_access_token() -> None:
    token = create_access_token("user-123", expires_minutes=5)
    payload = decode_access_token(token)

    assert payload["sub"] == "user-123"
