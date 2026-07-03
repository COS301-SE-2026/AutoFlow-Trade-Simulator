from datetime import datetime
from decimal import Decimal
import pytest
import os
from dotenv import load_dotenv
from sqlmodel import Session, SQLModel, create_engine, select
from app.models.HistPrice import HistPrice

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError("Could not find database URL")

#Try to connect to the db if you cant connect kill the connection and rollback
#Upon sucessfull test rollback and kill the connection
@pytest.fixture(name="hist_price_session")
def hist_price_session_fixture():
    engine = create_engine(DATABASE_URL)
    connection = engine.connect()
    transaction = connection.begin()

    try:
        with Session(bind=connection) as session:
            yield session
    except Exception as e:
        transaction.rollback()
        connection.close()
        raise e

    transaction.rollback()
    connection.close()

def test_hist_price_storage_and_retrieval(hist_price_session: Session):

    testing_date = datetime(2025, 7, 3, 17, 0, 0)

    new_price_test = HistPrice(
        asset_id=1,
        volume=500,
        open_price=Decimal("120.50"),
        high_price=Decimal("130.75"),
        low_price=Decimal("119.80"),
        symbol="AAPL",
        offical_close=Decimal("100.20"),
        date=testing_date
    )

    hist_price_session.add(new_price_test)
    hist_price_session.flush()

    #I need to see if the test is being written to the db so pause the execution
    #note for self press c then enter to resume the test
    breakpoint()

    #Wipe the cache
    hist_price_session.expire_all()

    statement = select(HistPrice).where(
        HistPrice.asset_id == 1,
        HistPrice.date == testing_date
    )
    retrieved_data = hist_price_session.exec(statement).first()

    assert retrieved_data is not None, "Failed to get data."
    assert retrieved_data.symbol == "AAPL"
    assert retrieved_data.volume == 500
    assert retrieved_data.open_price == Decimal("120.50")
    assert retrieved_data.high_price == Decimal("130.75")
    assert retrieved_data.offical_close == Decimal("100.20")
    assert retrieved_data.date == testing_date