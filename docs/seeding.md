# Database Seeding

## Overview

The seeding system provides idempotent database initialization via `backend/seeds.py`. Seed data can be loaded directly or as part of the database reset workflow.

## Data Structure

Define seed data at the top of `seeds.py` as arrays of dictionaries:

```python
user_data = [
    {"email": "alice@example.com", "full_name": "Alice Smith", "password_hash": "hashed_password_1"},
    {"email": "bob@example.com", "full_name": "Bob Jones", "password_hash": "hashed_password_2"},
]

currency_data = [
    {"code": "USD", "name": "US Dollar"},
    {"code": "EUR", "name": "Euro"},
]

asset_data = [
    {"ticker": "AAPL", "name": "Apple Inc.", "asset_type": "STOCK"},
    {"ticker": "GOOGL", "name": "Alphabet Inc.", "asset_type": "STOCK"},
]
```

Each array corresponds to one model. Add more by following the same pattern.

## Upsert Logic

The `upsert_records()` function handles insertion and updates by unique key:

```python
def upsert_records(session: Session, model_class, data_list: list, unique_key: str) -> int:
    """Record upsert by unique key. Returns count of newly created records."""
```

**Parameters:**
- `model_class`: The SQLModel class (User, Currency, Asset, etc.)
- `data_list`: Array of dicts with record fields
- `unique_key`: Field name used to check existence (e.g., "email", "code", "ticker")

**Behavior:**
1. Iterate through each record in `data_list`
2. Query `model_class` by `unique_key` to check if it exists
3. If new: create and add to session
4. If exists: update all fields with new values
5. Commit and return count of newly created records

**Example:**
```python
users_added = upsert_records(session, User, user_data, "email")
```

This checks each user by email. If `alice@example.com` exists, it updates her record. Otherwise, it creates a new one.

## Usage

### Direct seeding
```bash
npm run db:seed
```

Runs `backend/seeds.py` and outputs results:
```
✓ Users synced (2 new)
✓ Currencies synced (4 new)
✓ Assets synced (5 new)

✓ Database seeding complete
```

### As part of database reset
```bash
npm run db:reset
```

Drops all tables → runs migrations → seeds database (~10 seconds).

## Idempotency

The seeding system is **fully idempotent**. Running it multiple times on the same database:
- First run: Creates all records, outputs `(X new)`
- Second run: Updates existing records, outputs `(0 new)`

Safe to run in development, testing, or as part of CI/CD initialization.

## Adding New Models

1. **Define data array** at the top of `seeds.py`:
   ```python
   portfolio_data = [
       {"name": "Portfolio 1", "user_id": 1},
       {"name": "Portfolio 2", "user_id": 2},
   ]
   ```

2. **Add one line** in `seed_data()`:
   ```python
   portfolios_added = upsert_records(session, Portfolio, portfolio_data, "name")
   print(f"✓ Portfolios synced ({portfolios_added} new)")
   ```

3. **Import the model** at the top:
   ```python
   from app.models import User, Currency, Asset, Portfolio
   ```

## Performance Notes

- Seeding 100+ records is fast (~1 second)
- Each model's records are committed separately (can be batched if needed)
- Queries use indexed fields (unique keys), so lookups are efficient
- Safe to run on production (reads existing data via unique key before any write)
