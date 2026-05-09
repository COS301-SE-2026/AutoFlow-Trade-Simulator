#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if [[ ! -f .env ]]; then
  if [[ -f .env.example ]]; then
    cp .env.example .env
    echo "Created .env from .env.example"
  else
    echo "Missing .env and .env.example" >&2
    exit 1
  fi
fi

set -a
source .env
set +a

echo "Dropping all tables..."
cd backend
python -c "
from sqlmodel import create_engine, SQLModel
from app.settings import settings
from app import models

engine = create_engine(settings.database_url)
SQLModel.metadata.drop_all(engine)
print('✓ All tables dropped')
"

echo "Running migrations..."
../.venv/bin/alembic -c alembic.ini upgrade head

echo "Seeding database..."
../.venv/bin/python seeds.py

echo ""
echo "✓ Database reset and seeded successfully"
