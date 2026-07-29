from datetime import datetime, timedelta, UTC
from sqlmodel import Session, text
import pytest

from tests.conftest import  client, get_token, test_engine
from app.epics.Datapoints.DatapointsService import DatapointsService
from app.epics.Datapoints.DatapointsDTO import QueryParameters, IntervalParameters, Interval

OHLCV_VIEWS = ["ohlcv_1d", "ohlcv_1w", "ohlcv_1m", "ohlcv_6m", "ohlcv_1y"]

def setup_sqlite_views(session:Session):

    for view in OHLCV_VIEWS:
        session.execute(text(f"DROP TABLE IF EXISTS {view};"))
        session.execute(text(f"""
            CREATE TABLE IF NOT EXISTS {view} (
                asset_id INTEGER,
                bucket_time TIMESTAMP,
                open REAL,
                high REAL,
                low REAL,
                close REAL,
                volume REAL
            );
        """))

    session.execute(text(f"DROP TABLE IF EXISTS dailyohlcv;"))
    session.execute(text("""
        CREATE TABLE IF NOT EXISTS dailyohlcv (
            asset_id INTEGER,
            timestamp TIMESTAMP,
            open REAL,
            high REAL,
            low REAL,
            close REAL,
            volume REAL
        );
    """))
    session.commit()

@pytest.fixture
def seed_datapoints():

    with Session(test_engine) as session:
        setup_sqlite_views(session)

        now = datetime.now(UTC)

        #1d
        session.execute(
            text("""
            INSERT INTO ohlcv_1d (asset_id, bucket_time, open, high, low, close, volume)
            VALUES (1, :time, 95.0, 110.0, 90.0, 107.0, 35000.0);
            """),
            [
            {"time": now - timedelta(days=1)},
            {"time": now}
            ]
        )

        #1w
        session.execute(
            text("""
                INSERT INTO ohlcv_1w (asset_id, bucket_time, open, high, low, close, volume)
                VALUES (1, :time, 95.0, 110.0, 90.0, 107.0, 35000.0);
            """),
            [
            {"time": now - timedelta(weeks=1)},
            {"time": now}
            ]
        )

        #1m
        session.execute(
            text("""
                INSERT INTO ohlcv_1m (asset_id, bucket_time, open, high, low, close, volume)
                VALUES (1, :time, 95.0, 110.0, 90.0, 107.0, 35000.0);
            """),
            [
            {"time": now - timedelta(days=30)},
            {"time": now}
            ]
            
        )

        #6m
        session.execute(
            text("""
                INSERT INTO ohlcv_6m (asset_id, bucket_time, open, high, low, close, volume)
                VALUES (1, :time, 95.0, 110.0, 90.0, 107.0, 35000.0);
            """),
            [
            {"time": now - timedelta(days=180)},
            {"time": now}
            ]
        )

        #1y
        session.execute(
            text("""
                INSERT INTO ohlcv_1y (asset_id, bucket_time, open, high, low, close, volume)
                VALUES (1, :time, 95.0, 110.0, 90.0, 107.0, 35000.0);
            """),
            [
            {"time": now - timedelta(days=365)},
            {"time": now}
            ]
        )


        session.commit()

def test_get_predef_chart_success_1d(seed_datapoints) -> None:
    
    token = get_token()

    response = client.get(
        "/assets/1/chart_predef?interval=1d",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 2
    assert data[0]["open"] == 95.0
    assert data[0]["volume"] == 35000.0

def test_get_predef_chart_success_1w(seed_datapoints) -> None:
    
    token = get_token()

    response = client.get(
        "/assets/1/chart_predef?interval=1w",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 2
    assert data[0]["open"] == 95.0
    assert data[0]["volume"] == 35000.0

def test_get_predef_chart_success_1m(seed_datapoints) -> None:
    
    token = get_token()

    response = client.get(
        "/assets/1/chart_predef?interval=1m",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 2
    assert data[0]["open"] == 95.0
    assert data[0]["volume"] == 35000.0

def test_get_predef_chart_success_6m(seed_datapoints) -> None:
    
    token = get_token()

    response = client.get(
        "/assets/1/chart_predef?interval=6m",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 2
    assert data[0]["open"] == 95.0
    assert data[0]["volume"] == 35000.0

def test_get_predef_chart_success_1y(seed_datapoints) -> None:
    
    token = get_token()

    response = client.get(
        "/assets/1/chart_predef?interval=1y",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 2
    assert data[0]["open"] == 95.0
    assert data[0]["volume"] == 35000.0

def test_get_predef_chart_no_data(seed_datapoints) -> None:

    token = get_token()

    response = client.get(
        "/assets/999/chart_predef?interval1d",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 0

def test_get_predef_chart_invalid_interval(seed_datapoints) -> None:

    token = get_token()

    response = client.get(
        "/assets/1/chart_predef?interval=invalid_interval",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 422