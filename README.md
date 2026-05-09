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

1. Copy the environment file.
2. Start the local services.
3. Run backend migrations.
4. Start the backend.
5. Start the frontend.

You can also use the root npm scripts:

```bash
npm run dev
```

Or start one side only:

```bash
npm run backend
npm run frontend
```

```bash
cp .env.example .env

npm run db:start
npm run migrate

cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

In a second terminal:

```bash
cd frontend
npm install
```

The root `package.json` also includes scripts for `db:stop`, `db:start`, `migrate`, `backend`, `frontend`, and `dev`.

## Environment variables

The backend reads the database URL from `DATABASE_URL` only. The frontend reads the API URL from `NEXT_PUBLIC_API_URL`.

## First routes

- `GET /health` returns a basic service check.
- `GET /demo` returns a small sample payload for the frontend to consume.

## Migrations

Alembic is configured under `backend/alembic/`. The initial migration creates the starter `users` table.

```bash
cd backend
alembic upgrade head
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
