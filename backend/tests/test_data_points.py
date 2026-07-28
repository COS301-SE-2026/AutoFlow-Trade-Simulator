from datetime import datetime, timedelta, UTC
from sqlmodel import Session, text

from tests.conftest import  client, get_token, test_engine
from app.epics.datapoints.DatapointsService import DatapointsService
from app.epics.datapoints.DatapointsDTO import QueryParameters, IntervalParameters, Interval

def seed_ohlcv_views():
    with Session(test_engine) as session:

    now = datetime.now(UTC)

    session.execute(
        text("""
            INSERT INTO ohlcv_1d (asset_id, bucket_time, open, high, low, close, volume)
            VALUES (1, :time, 100.0, 105.0, 99.0, 102.5, 5000.0);
        """),
        {"time": now}
    )

    session.execute(
        text("""
            INSERT INTO ohlcv_1d (asset_id, timestamp, open, high, low, close, volume)
            VALUES (1, :time, 50.0, 55.0, 48.0, 52.0, 1200.0);
        """),
        {"time": now}
    )

    session.commit()

