# AutoFlow Trade Simulator

AutoFlow is a local-first starter repo for a trading simulator stack. The first setup is intentionally small so a new developer can clone the repo, start the database, run the backend, and open the frontend without designing the architecture first.

## What is included

- FastAPI backend in `backend/`
- Next.js frontend in `frontend/`
- PostgreSQL and Redis in Docker
- Example config driven by environment variables
- Tiny starter docs in `docs/`

## Repo layout

- `backend/` FastAPI app, Epic controllers/services/DTOs, database models, tasks, tests, and Alembic
- `backend/app/epics/` Epic folders such as `core`, `market_data`, `ui`, and `portfolio`
- `backend/app/models/` one file per SQLModel table
- `frontend/` Next.js app and reusable UI components
- `docs/` short beginner notes for each major area
- `docker-compose.yml` local infrastructure
- `.env.example` shared environment variables

## Setup flow

The repo now uses Node-based scripts, so the same npm commands work on macOS, Linux, and Windows.

1. Copy the environment file:

```bash
cp .env.example .env
```

2. Set up the project environment and install backend plus frontend dependencies:

```bash
npm run setup
```

This creates a repository-level virtual environment at `.venv` and installs backend Python packages and frontend `node_modules`.

3. Start local infrastructure (Postgres + Redis):

```bash
npm run db:start
```

4. Apply migrations and seed the database:

```bash
npm run migrate
npm run db:seed
```

5. Start the backend and frontend:

```bash
npm run backend
npm run frontend
```

Useful shortcuts:

```bash
npm run dev
npm run db:reset
```

- Wait a few seconds after `npm run db:start` before running migrations so Postgres finishes startup.
- `npm run db:reset` drops all tables, runs migrations, then seeds the DB (useful for clean local resets).

## Environment variables

The backend reads the database URL from `DATABASE_URL` only. The frontend reads the API URL from `NEXT_PUBLIC_API_URL`.

## First routes

- `GET /health` returns a basic service check.
- `GET /demo` returns a small sample payload for the frontend to consume.

## Migrations

Alembic is configured under `backend/alembic/`. The canonical initial migration creates the current schema (all model tables).

Apply migrations from the repository root with the npm scripts:

```bash
npm run migrate
npm run migrate:dev -- "describe schema change"
```

Notes:
- `npm run migrate` applies migrations to head.
- `npm run migrate:dev -- "message"` generates an autogenerate migration (uses SQLModel metadata) then upgrades to head.
- These scripts run cross-platform and no longer depend on shell helpers.

## Seeding

An idempotent seeder populates development data. The seeder implementation is `backend/seeds.py` and documentation lives at `docs/seeding.md`.

From the repository root:

```bash
npm run db:seed
npm run db:reset
```

### Automatic schema sync (optional)

This project includes an optional automatic schema synchronization feature that will create any missing tables at application startup from your `SQLModel` models. It's controlled by the `auto_sync_db` setting in `backend/app/settings.py` and can be set via environment variables using the `.env` file.

- To enable (default for local dev): set `AUTO_SYNC_DB=true` or leave it unset since the default is `true`.
- To disable (recommended for production): set `AUTO_SYNC_DB=false` and run Alembic migrations instead.

If automatic sync is enabled the FastAPI startup event will call `SQLModel.metadata.create_all(engine)`. This is convenient for local development but does not replace proper migrations for production schema changes.

## Testing

Backend tests live in `backend/tests/`.

```bash
cd backend
pytest
```

## Adding new code

- Put API and data logic in `backend/app/epics/<epic_name>/`
- Use `EpicController.py` for routes and `EpicService.py` for business logic
- Use `EpicDTOs.py` for request/response DTOs
- Keep SQLModel tables in `backend/app/models/<table_name>.py`
- Put frontend pages and components in `frontend/app/` and `frontend/components/`
- Keep new features behind environment-driven configuration
- Add a small test with each new feature where practical

## Later Supabase path

This setup is designed so the database backend can move from local Docker Postgres to Supabase later without changing feature code. Keep the schema portable and keep database connection details in environment variables.
