from datetime import datetime
from decimal import Decimal
import pytest
from dotenv import load_dotenv
from sqlmodel import Session, SQLModel, create_engine, select
from hist_price import ../app/models/HistPrice

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError("Could not find database URL")

@pytest.fixture(name="db_session")
