from sqlmodel import Session, select

from app.database import engine
from app.models import (
    User,
    Currency,
    Asset,
    Report,
    ReportSection,
    Transaction,
    Direction,
    Period,
    InternationalAccount,
    Portfolio,
)
from app.core.security import create_password_hash

# Seed data definitions
user_data = [
    {
        "email": "alice@example.com",
        "full_name": "Alice Smith",
        "password_hash": "hashed_password_1",
    },
    {"email": "bob@example.com", "full_name": "Bob Jones", "password_hash": "hashed_password_2"},
    {
        "email": "charlie@example.com",
        "full_name": "Charlie Brown",
        "password_hash": "hashed_password_3",
    },
    {"email": "diana@example.com", "full_name": "Diana Prince", "password_hash": "hashed_password_4"},
    {"email": "eve@example.com", "full_name": "Eve Turner", "password_hash": "hashed_password_5"},
    {"email": "testUser@example.com", "full_name": "Test User", "password_hash": create_password_hash("1234567890")}
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
    {"ticker": "BTC/USDT", "name": "Bitcoin", "asset_type": "CRYPTO"},
    {"ticker": "ETH/USDT", "name": "Ethereum", "asset_type": "CRYPTO"},
    {"ticker": "SOL/USDT", "name": "Solana", "asset_type": "CRYPTO"},
    {"ticker": "DOT/USDT", "name": "Polkadot", "asset_type": "CRYPTO"},
    {"ticker": "AMZN", "name": "Amazon.com Inc.", "asset_type": "STOCK"},
    {"ticker": "NVDA", "name": "NVIDIA Corporation", "asset_type": "STOCK"},
    {"ticker": "META", "name": "Meta Platforms Inc.", "asset_type": "STOCK"},
    {"ticker": "NFLX", "name": "Netflix Inc.", "asset_type": "STOCK"},
]

report_data = [
    {"user_id": 1, "period": Period.Weekly},
]

report_section_data = [
    {
        "report_id": 1,
        "ticker": "AAPL",
        "open_price": 183.20,
        "close_price": 187.20,
        "pct_change": 2.18,
        "period_high": 188.75,
        "period_low": 182.10,
    },
    {
        "report_id": 1,
        "ticker": "GOOGL",
        "open_price": 178.50,
        "close_price": 182.10,
        "pct_change": 2.02,
        "period_high": 183.40,
        "period_low": 177.80,
    },
    {
        "report_id": 1,
        "ticker": "MSFT",
        "open_price": 420.50,
        "close_price": 429.75,
        "pct_change": 2.20,
        "period_high": 431.50,
        "period_low": 419.80,
    },
    {
        "report_id": 1,
        "ticker": "TSLA",
        "open_price": 243.00,
        "close_price": 250.10,
        "pct_change": 2.92,
        "period_high": 251.20,
        "period_low": 242.10,
    },
    {
        "report_id": 1,
        "ticker": "BTC/USDT",
        "open_price": 65000.00,
        "close_price": 68000.00,
        "pct_change": 4.62,
        "period_high": 69000.00,
        "period_low": 64000.00,
    },
    {
        "report_id": 1,
        "ticker": "ETH/USDT",
        "open_price": 3400.00,
        "close_price": 3435.40,
        "pct_change": 1.04,
        "period_high": 3520.00,
        "period_low": 3315.20,
    },
]

transaction_data = [
    {"account_id": 1, "asset_id": 1, "direction": Direction.Buy, "quantity": 10, "price_at_execution": 185.50},
    {"account_id": 1, "asset_id": 2, "direction": Direction.Buy, "quantity": 5, "price_at_execution": 180.25},
    {"account_id": 1, "asset_id": 3, "direction": Direction.Sell, "quantity": 2, "price_at_execution": 425.00},
    {"account_id": 1, "asset_id": 4, "direction": Direction.Buy, "quantity": 8, "price_at_execution": 245.75},
    {"account_id": 1, "asset_id": 5, "direction": Direction.Buy, "quantity": 0.5, "price_at_execution": 66000.00},
    {"account_id": 1, "asset_id": 6, "direction": Direction.Sell, "quantity": 3, "price_at_execution": 3450.00},
    {"account_id": 1, "asset_id": 7, "direction": Direction.Buy, "quantity": 50, "price_at_execution": 150.00},
    {"account_id": 1, "asset_id": 1, "direction": Direction.Sell, "quantity": 5, "price_at_execution": 190.00},
    {"account_id": 1, "asset_id": 5, "direction": Direction.Buy, "quantity": 0.2, "price_at_execution": 67500.00},
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

        # Create portfolios for users
        users = session.exec(select(User)).all()
        portfolios_added = 0
        for user in users:
            statement = select(Portfolio).where(Portfolio.user_id == user.id)
            existing_portfolio = session.exec(statement).first()
            if not existing_portfolio:
                portfolio = Portfolio(user_id=user.id, name=f"{user.full_name}'s Portfolio", cash_balance=100000)
                session.add(portfolio)
                portfolios_added += 1
        session.commit()
        print(f"✓ Portfolios synced ({portfolios_added} new)")

        currencies_added = upsert_records(session, Currency, currency_data, "code")
        print(f"✓ Currencies synced ({currencies_added} new)")

        assets_added = upsert_records(session, Asset, asset_data, "ticker")
        print(f"✓ Assets synced ({assets_added} new)")

        # Create international accounts
        portfolios = session.exec(select(Portfolio)).all()
        currencies = session.exec(select(Currency)).all()
        accounts_added = 0
        for portfolio in portfolios:
            # Create a USD account for each portfolio for simplicity
            usd_currency = next((c for c in currencies if c.code == "USD"), None)
            if usd_currency:
                statement = select(InternationalAccount).where(
                    InternationalAccount.portfolio_id == portfolio.id,
                    InternationalAccount.currency_id == usd_currency.id,
                )
                existing_account = session.exec(statement).first()
                if not existing_account:
                    account = InternationalAccount(
                        portfolio_id=portfolio.id, currency_id=usd_currency.id, balance=100000
                    )
                    session.add(account)
                    accounts_added += 1
        session.commit()
        print(f"✓ International Accounts synced ({accounts_added} new)")

        reports_added = upsert_records(session, Report, report_data, "user_id")
        print(f"✓ Reports synced ({reports_added} new)")

        report_sections_added = 0
        for section_data in report_section_data:
            statement = select(ReportSection).where(
                ReportSection.report_id == section_data["report_id"],
                ReportSection.ticker == section_data["ticker"],
            )
            existing = session.exec(statement).first()
            if not existing:
                record = ReportSection(**section_data)
                session.add(record)
                report_sections_added += 1
        session.commit()
        print(f"✓ Report Sections synced ({report_sections_added} new)")

        transactions_added = 0
        for trans_data in transaction_data:
            record = Transaction(**trans_data)
            session.add(record)
            transactions_added += 1
        session.commit()
        print(f"✓ Transactions synced ({transactions_added} new)")


if __name__ == "__main__":
    seed_data()
    print("\n✓ Database seeding complete")
