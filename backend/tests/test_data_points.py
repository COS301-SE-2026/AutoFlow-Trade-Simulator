from datetime import datetime, timedelta, UTC
from sqlmodel import Session, text
import pytest
from fastapi import HTTPException
from sqlalchemy import event

from tests.conftest import  client, get_token, test_engine
from app.epics.Datapoints.DatapointsService import DatapointsService
from app.epics.Datapoints.DatapointsDTO import QueryParameters, IntervalParameters, Interval

OHLCV_VIEWS = ["ohlcv_1d", "ohlcv_1w", "ohlcv_1m", "ohlcv_6m", "ohlcv_1y"]

class FirstAgg:
    def __init__(self):
        self.val = None
        self.min_ts = None
    
    def step(self, value, ts):
        if self.min_ts is None or ts < self.min_ts:
            self.min_ts = ts
            self.val = value

    def finalize(self):
        return self.val

class LastAgg:
    def __init__(self):
        self.val = None
        self.max_ts = None

    def step(self, value, ts):
        if self.max_ts is None or ts > self.max_ts:
            self.max_ts = ts
            self.val = value

    def finalize(self):
        return self.val 
    

@event.listens_for(test_engine, "connect")
def sqlite_engine_connect(dbapi_connection, connection_record):
    dbapi_connection.create_function("time_bucket", 2, lambda interval, ts: ts)
    dbapi_connection.create_aggregate("first", 2, FirstAgg)
    dbapi_connection.create_aggregate("last", 2, LastAgg)

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

        session.execute(
            text("""
                INSERT INTO dailyohlcv (asset_id, timestamp, open, high, low, close, volume)
                VALUES (1, :time, 95.0, 110.0, 90.0, 107.0, 35000.0);
            """),
            [
            {"time": now - timedelta(days=1)},
            {"time": now}
            ]
        )

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
    result = response.json()
    assert isinstance(result, list)
    assert len(result) == 2
    assert result[0]["open"] == 95.0
    assert result[0]["high"] == 110.0
    assert result[0]["low"] == 90.0
    assert result[0]["close"] == 107.0
    assert result[0]["volume"] == 35000.0

def test_get_predef_chart_success_1w(seed_datapoints) -> None:
    
    token = get_token()

    response = client.get(
        "/assets/1/chart_predef?interval=1w",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    result = response.json()
    assert isinstance(result, list)
    assert len(result) == 2
    assert result[0]["open"] == 95.0
    assert result[0]["high"] == 110.0
    assert result[0]["low"] == 90.0
    assert result[0]["close"] == 107.0
    assert result[0]["volume"] == 35000.0

def test_get_predef_chart_success_1m(seed_datapoints) -> None:
    
    token = get_token()

    response = client.get(
        "/assets/1/chart_predef?interval=1m",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    result = response.json()
    assert isinstance(result, list)
    assert len(result) == 2
    assert result[0]["open"] == 95.0
    assert result[0]["high"] == 110.0
    assert result[0]["low"] == 90.0
    assert result[0]["close"] == 107.0
    assert result[0]["volume"] == 35000.0

def test_get_predef_chart_success_6m(seed_datapoints) -> None:
    
    token = get_token()

    response = client.get(
        "/assets/1/chart_predef?interval=6m",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    result = response.json()
    assert isinstance(result, list)
    assert len(result) == 2
    assert result[0]["open"] == 95.0
    assert result[0]["high"] == 110.0
    assert result[0]["low"] == 90.0
    assert result[0]["close"] == 107.0
    assert result[0]["volume"] == 35000.0

def test_get_predef_chart_success_1y(seed_datapoints) -> None:
    
    token = get_token()

    response = client.get(
        "/assets/1/chart_predef?interval=1y",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    result = response.json()
    assert isinstance(result, list)
    assert len(result) == 2
    assert result[0]["open"] == 95.0
    assert result[0]["high"] == 110.0
    assert result[0]["low"] == 90.0
    assert result[0]["close"] == 107.0
    assert result[0]["volume"] == 35000.0

def test_get_predef_chart_no_data(seed_datapoints) -> None:

    token = get_token()

    response = client.get(
        "/assets/999/chart_predef?interval=1d",
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

def test_sampled_ohlcv_success(seed_datapoints) -> None:
    with Session (test_engine) as session:

        now = datetime.now(UTC)
        service = DatapointsService(session)
        params = QueryParameters(
            start_date=now - timedelta(days=2),
            end_date=now,
            data_points=2
        )

        result = service.sampled_ohlcv(asset_id=1, params=params)

        assert isinstance(result, list)
        assert len(result) == 2
        assert result[0].open == 95.0
        assert result[0].high == 110.0
        assert result[0].low == 90.0
        assert result[0].close == 107.0
        assert result[0].volume == 35000.0

def test_sampled_ohlcv_invalid_dates() -> None:
    with Session(test_engine) as session:
        service = DatapointsService(session)

        now = datetime.now(UTC)

        params = QueryParameters (
            start_date=now,
            end_date= now - timedelta(days=1),
            data_points=100
        )

        with pytest.raises(HTTPException) as info:
            service.sampled_ohlcv(asset_id=1, params=params)

        assert info.value.status_code == 400