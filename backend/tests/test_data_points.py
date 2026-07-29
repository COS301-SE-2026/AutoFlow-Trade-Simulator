from datetime import datetime, timedelta, UTC
from sqlmodel import Session, text
import pytest

from tests.conftest import  client, get_token, test_engine
from app.epics.Datapoints.DatapointsService import DatapointsService
from app.epics.Datapoints.DatapointsDTO import QueryParameters, IntervalParameters, Interval

OHLCV_VIEWS = ["ohlcv_1d", "ohlcv_1w", "ohlcv_1m", "ohlcv_6m", "ohlcv_1y"]

def setup_sqlite_views(session:Session):

    for view in OHLCV_VIEWS:
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
            VALUES (1, :time, 100.0, 105.0, 99.0, 102.5, 5000.0);
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
            {"time": now - timedelta(weeks=1)}
        )

        #1m
        session.execute(
            text("""
                INSERT INTO ohlcv_1m (asset_id, bucket_time, open, high, low, close, volume)
                VALUES (1, :time, 95.0, 110.0, 90.0, 107.0, 35000.0);
            """),
            {"time": now - timedelta(days=30)}
        )

        #6m
        session.execute(
            text("""
                INSERT INTO ohlcv_6m (asset_id, bucket_time, open, high, low, close, volume)
                VALUES (1, :time, 95.0, 110.0, 90.0, 107.0, 35000.0);
            """),
            {"time": now - timedelta(days=180)}
        )

        #1y
        session.execute(
            text("""
                INSERT INTO ohlcv_1y (asset_id, bucket_time, open, high, low, close, volume)
                VALUES (1, :time, 95.0, 110.0, 90.0, 107.0, 35000.0);
            """),
            {"time": now - timedelta(days=365)}
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
    assert data[0]["open"] == 100.0
    assert data[0]["volume"] == 5000.0