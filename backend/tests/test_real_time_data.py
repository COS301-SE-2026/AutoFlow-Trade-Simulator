from datetime import datetime, timedelta
from decimal import Decimal
from sqlmodel import Session, select
from app.models.currency import Currency
from tests.conftest import test_engine,client
from app.models.asset import Asset
from app.models.real_time_ticks import RealTimeTicks


def seed_asset(ticker: str = "AAPL") -> int:
    with Session(test_engine) as session:
        existing = session.exec(select(Asset).where(Asset.symbol == ticker)).first()
        if existing is not None:
            assert existing.asset_id is not None
            return existing.asset_id
        
    asset = Asset(symbol=ticker, asset_class="STOCK", exchange="NASDAQ", currency="ZAR")
    session.add(asset)
    session.commit()
    session.refresh(asset)
    assert asset.asset_id is not None
    return asset.asset_id
                
def seed_currency(code: str = "ZAR") -> None:
    with Session(test_engine) as session:
        currency = Currency(code=code, name="South African rand")
        session.add(currency)
        session.commit()

def seed_tick(asset_id: int, timestamp: datetime, price: str = "100.00", volume: str = "10.00") ->None:
    with Session(test_engine) as session:
        tick= RealTimeTicks(asset_id=asset_id,timestamp=timestamp,price=Decimal(price),volume=Decimal(volume))
        session.add(tick)
        session.commit()


def test_status()->None:
    response =client.get("real_time/status")
    assert response.status_code==200
    body =response.json()
    assert body["epic"]== "Real Time Data"
    assert body["status"]== "healthy"

def test_get_real_data_asset_not_found()->None:
    res=client.get("/real_time/points/DOESNOTEXIST")
    assert res.status_code==404

def test_get_real_data_no_ticks()->None:
    seed_asset("AAPL")
    res=client.get("/real_time/points/AAPL")
    assert res.status_code==200
    assert res.json()["points"]==[]

def test_get_real_data_returns_recent_ticks()->None:
    asset_id=seed_asset("AAPL")
    now=datetime.utcnow()
    seed_tick(asset_id, now - timedelta(hours=1))
    seed_tick(asset_id, now - timedelta(minutes=5))
    res=client.get("/real_time/points/AAPL")
    assert res.status_code==200
    points= res.json()["points"]
    assert len(points)==2
    
def test_get_real_data_excludes_ticks_older_than_a_day() -> None:
    asset_id=seed_asset("AAPL")
    now=datetime.utcnow()
    seed_tick(asset_id, now - timedelta(days=2))
    seed_tick(asset_id, now - timedelta(minutes=10))
    res=client.get("/real_time/points/AAPL")
    assert res.status_code==200
    points= res.json()["points"]
    assert len(points)==1


def test_get_real_data_only_returns_ticks_for_requested_asset() -> None:
    aapl_id = seed_asset("AAPL")
    msft_id = seed_asset("MSFT")
    now = datetime.utcnow()
    seed_tick(aapl_id, now - timedelta(minutes=5), price="150.00")
    seed_tick(msft_id, now - timedelta(minutes=5), price="300.00")

    response = client.get("/real_time/points/AAPL")
    assert response.status_code == 200
    points = response.json()["points"]
    assert len(points) == 1
    assert points[0]["price"] == "150.0000"

