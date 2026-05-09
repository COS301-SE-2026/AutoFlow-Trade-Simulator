# Database Overview

The local database starts as PostgreSQL in Docker.

What it does:
- Stores the app data for local development
- Gives the team a stable schema target before Supabase later
- Works with Alembic migrations

Where it lives:
- Compose file: `docker-compose.yml`
- Database URL: `.env.example`
- Migrations: `backend/alembic/`
- SQLModel tables: `backend/app/models/`

Smallest example:
- Start the `db` service
- Run `alembic upgrade head`
