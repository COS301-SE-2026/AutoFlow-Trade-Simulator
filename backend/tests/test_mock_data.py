from app.mock_data import generate_price_series


def test_generate_price_series_is_deterministic() -> None:
    assert generate_price_series(seed=11, count=3) == generate_price_series(seed=11, count=3)
