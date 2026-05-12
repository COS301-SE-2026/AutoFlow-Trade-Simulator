# Setup Guide

This guide walks you through setting up the AutoFlow Trade Simulator for the first time.

## Prerequisites

- **macOS/Linux/Windows** with at least 8GB RAM
- **Docker Desktop** installed and running
- **Node.js 16+** installed
- **Python 3.10+** installed (system or via `brew install python3`)

## Step-by-step setup

### 1. Open Docker Desktop

On macOS, open Applications > Docker.app. On Linux, ensure Docker daemon is running.

Wait for Docker to fully start before proceeding to the next step.

### 2. Clone or prepare the repository

If cloning:
```bash
git clone <repository-url>
cd AutoFlow-Trade-Simulator
```

### 3. Create environment file

Copy the example environment file:

```bash
cp .env.example .env
```

This creates `.env` with the default configuration. For local development, the defaults are fine.

### 4. Install dependencies

Run the setup script once:

```bash
npm run setup
```

This will:
- Create a Python virtual environment at `.venv`
- Install backend dependencies from `backend/requirements.txt`
- Install frontend dependencies into `frontend/node_modules`

This step only needs to run once. If it fails, ensure Python 3.10+ is on your PATH.

### 5. Start local infrastructure

Start the PostgreSQL database and Redis cache:

```bash
npm run db:start
```

**Wait 3-5 seconds** for PostgreSQL to fully initialize before moving to the next step.

You can verify it's ready by running:
```bash
docker compose ps
```

Both `db` and `redis` should show status `Up`.

### 6. Apply database migrations

Run the migration to create the schema:

```bash
npm run migrate
```

This applies all pending Alembic migrations to the database.

### 7. Seed the database (optional)

Populate the database with sample data:

```bash
npm run db:reset
```

This drops all tables, runs migrations fresh, and seeds the database with default currencies and sample assets.

### 8. Start development server

Start both the backend and frontend:

```bash
npm run dev
```

This will:
- Start the FastAPI backend on `http://localhost:8000`
- Start the Next.js frontend on `http://localhost:3000`

You should see output like:
```
[backend] started
[frontend] started
```

Open `http://localhost:3000` in your browser to see the frontend.

## Verification

Once running, verify everything works:

- **Frontend**: Visit `http://localhost:3000` — should show the app homepage
- **Backend health**: Visit `http://localhost:8000/health` — should return status 200
- **API demo**: Visit `http://localhost:8000/demo` — should return sample data

## Troubleshooting

### Port already in use

If port 8000 or 3000 is already in use, stop the other process or modify `.env` to configure different ports.

### Database connection error

Ensure:
1. Docker Desktop is running
2. `npm run db:start` completed successfully
3. Wait another 5 seconds and retry the command

### Python/Node not found

Ensure Python 3.10+ and Node.js 16+ are installed and on your PATH:

```bash
python3 --version
node --version
```

### Venv creation fails

Delete the broken `.venv` and try `npm run setup` again:

```bash
rm -rf .venv
npm run setup
```

## Daily workflow

After initial setup:

```bash
npm run db:start   # Start database (once per machine restart)
npm run dev        # Start backend and frontend
```

To reset the database to a clean state:

```bash
npm run db:reset
```

## Next steps

- Read [backend-overview.md](./backend-overview.md) to understand the FastAPI structure
- Read [frontend-overview.md](./frontend-overview.md) to understand the Next.js structure
- Check [database-overview.md](./database-overview.md) for the schema
- Read [testing.md](./testing.md) to run tests
