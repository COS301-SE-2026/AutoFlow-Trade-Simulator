from sqlmodel import Session, select

from app.database import engine
from app.models import User, Currency, Asset


# Seed data definitions
user_data = [
    {"email": "alice@example.com", "full_name": "Alice Smith", "password_hash": "hashed_password_1"},
    {"email": "bob@example.com", "full_name": "Bob Jones", "password_hash": "hashed_password_2"},
    {"email": "charlie@example.com", "full_name": "Charlie Brown", "password_hash": "hashed_password_3"},
    {"email": "diana@example.com", "full_name": "Diana Prince", "password_hash": "hashed_password_4"},
    {"email": "eve@example.com", "full_name": "Eve Turner", "password_hash": "hashed_password_5"},
]

currency_data = [
    {"code": "USD", "name": "US Dollar"},
    {"code": "EUR", "name": "Euro"},
    {"code": "GBP", "name": "British Pound"},
    {"code": "JPY", "name": "Japanese Yen"},
    {"code": "ZAR", "name": "South African Rand"},
    {"code": "AUD", "name": "Australian Dollar"},
    {"code": "CAD", "name": "Canadian Dollar"},
    {"code": "CHF", "name": "Swiss Franc"},
    {"code": "CNY", "name": "Chinese Yuan"},
    {"code": "INR", "name": "Indian Rupee"},
]

asset_data = [
    {"ticker": "AAPL", "name": "Apple Inc.", "asset_type": "STOCK"},
    {"ticker": "GOOGL", "name": "Alphabet Inc.", "asset_type": "STOCK"},
    {"ticker": "MSFT", "name": "Microsoft Corporation", "asset_type": "STOCK"},
    {"ticker": "TSLA", "name": "Tesla Inc.", "asset_type": "STOCK"},
    {"ticker": "BTC", "name": "Bitcoin", "asset_type": "CRYPTO"},
    {"ticker": "ETH", "name": "Ethereum", "asset_type": "CRYPTO"},
    {"ticker": "SOL", "name": "Solana", "asset_type": "CRYPTO"},
    {"ticker": "DOT", "name": "Polkadot", "asset_type": "CRYPTO"},
    {"ticker": "AMZN", "name": "Amazon.com Inc.", "asset_type": "STOCK"},
    {"ticker": "NVDA", "name": "NVIDIA Corporation", "asset_type": "STOCK"},
    {"ticker": "META", "name": "Meta Platforms Inc.", "asset_type": "STOCK"},
    {"ticker": "NFLX", "name": "Netflix Inc.", "asset_type": "STOCK"},
]


def upsert_records(session: Session, model_class, data_list: list, unique_key: str) -> int:
  
    seeded_count = 0
    for data in data_list:
        unique_value = data[unique_key]
        statement = select(model_class).where(getattr(model_class, unique_key) == unique_value)
        existing = session.exec(statement).first()
        
        if not existing:
            record = model_class(**data)
            session.add(record)
            seeded_count += 1
        else:
            for key, value in data.items():
                setattr(existing, key, value)
            session.add(existing)
    
    session.commit()
    return seeded_count


def seed_data() -> None:
    with Session(engine) as session:
        
        users_added = upsert_records(session, User, user_data, "email")
        print(f"✓ Users synced ({users_added} new)")
        
        currencies_added = upsert_records(session, Currency, currency_data, "code")
        print(f"✓ Currencies synced ({currencies_added} new)")
        
        assets_added = upsert_records(session, Asset, asset_data, "ticker")
        print(f"✓ Assets synced ({assets_added} new)")


if __name__ == "__main__":
    seed_data()
    print("\n✓ Database seeding complete")
