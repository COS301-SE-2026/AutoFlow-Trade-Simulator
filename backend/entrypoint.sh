#!/bin/sh
set -e

MAX_ATTEMPTS=30
COUNTER=0

echo "Waiting for PostgreSQL database connection at $DB_HOST:$DB_PORT..."

until python -c "
import socket, sys
try:
    s = socket.create_connection(('$DB_HOST', int('$DB_PORT')), timeout=2)
    s.close()
    sys.exit(0)
except Exception:
    sys.exit(1)
" 2>/dev/null; do
  COUNTER=$((COUNTER + 1))
  if [ $COUNTER -ge $MAX_ATTEMPTS ]; then
    echo "ERROR: DB unreachable after 60 seconds." >&2
    exit 1
  fi
  echo "Database unavailable - retrying in 2 seconds ($COUNTER/$MAX_ATTEMPTS)..." >&2
  sleep 2
done

echo "Database is reachable. Starting application..."
exec "$@"