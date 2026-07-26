#!/bin/bash
set -e

# Wait for PostgreSQL to be ready before proceeding
echo "--> Waiting for PostgreSQL..."
until PGPASSWORD=$POSTGRES_PASSWORD psql -h "db" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c '\q' 2>/dev/null; do
  echo "Database is unavailable - waiting..."
  sleep 2
done

echo "--> Running database migrations..."
alembic upgrade head

echo "--> Starting backend process..."
exec "$@"