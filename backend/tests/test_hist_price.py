from datetime import datetime
from decimal import Decimal
import pytest
import os
from dotenv import load_dotenv
from sqlmodel import Session, SQLModel, create_engine, select
from app.models import HistPrice

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