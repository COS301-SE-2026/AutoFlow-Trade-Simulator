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

cd backend

ALEMBIC_CMD="../.venv/bin/alembic -c alembic.ini"
MESSAGE="${1:-auto migration $(date +%Y%m%d_%H%M%S)}"

echo "Ensuring database is at current head"
$ALEMBIC_CMD upgrade head

echo "Generating migration: $MESSAGE"
$ALEMBIC_CMD revision --autogenerate -m "$MESSAGE"

echo "Applying migration"
$ALEMBIC_CMD upgrade head

echo "Done"
