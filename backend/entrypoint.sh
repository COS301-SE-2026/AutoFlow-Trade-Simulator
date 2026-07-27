#!/bin/bash
set -e

# Wait for PostgreSQL to be ready before proceeding
echo "--> Waiting for PostgreSQL..."
python -c "
import os, time, psycopg2

host = os.getenv('POSTGRES_HOST', 'db')
user = os.getenv('POSTGRES_USER')
password = os.getenv('POSTGRES_PASSWORD')
database = os.getenv('POSTGRES_DB')
port = os.getenv('POSTGRES_PORT', '5432')

while True:
    try:
        conn = psycopg2.connect(
            host=host, user=user, password=password, dbname=database, port=port, connect_timeout=3
        )
        conn.close()
        print('--> PostgreSQL is ready!')
        break
    except Exception:
        print('Database is unavailable - waiting...')
        time.sleep(2)
"

echo "--> Running database migrations..."
alembic upgrade head

echo "--> Starting backend process..."
exec "$@"