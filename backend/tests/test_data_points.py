from datetime import datetime, timedelta, UTC
from sqlmodel import Session, text

from tests.conftest import  client, get_token, test_engine
from app.epics.Datapoints.DatapointsService import DatapointsService
from app.epics.Datapoints.DatapointsDTO import QueryParameters, IntervalParameters, Interval

OHLCV_VIEWS = ["ohlcv_1d", "ohlcv_1w", "ohlcv_1m", "ohlcv_6m", "ohlcv_1y"]

def setup_sqlite_views(session:Session):

    for view in OHLCV_VIEWS:
        session.execute(text(f"""
            CREATE TABLE IF NOT EXSISTS {view} (
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