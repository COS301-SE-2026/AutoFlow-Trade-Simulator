#!/usr/bin/env bash
set -euo pipefail

export PATH=$PATH:/usr/local/bin:/usr/bin:/bin

# Load target slot environment variables set by after_install.sh
source /tmp/deployment_slot.env

echo "Validating target deployment slot $TARGET_SLOT on port $TARGET_PORT..."

# Retry loop for health check validation
MAX_RETRIES=10
SLEEP_INTERVAL=3

for i in $(seq 1 $MAX_RETRIES); do
  # Poll the health endpoint on the target port
  HEALTH=$(curl -s "http://localhost:$TARGET_PORT/health" || echo "FAIL")

  if [[ "$HEALTH" == *"status"* ]] && [[ "$HEALTH" == *"ok"* ]]; then
    echo "Health check passed on port $TARGET_PORT!"

    # Identify and stop the OLD slot container now that the new one is verified live
    OLD_SLOT=$([ "$TARGET_SLOT" == "blue" ] && echo "green" || echo "blue")
    echo "Stopping and removing legacy slot: autoflow-$OLD_SLOT..."
    docker stop "autoflow-$OLD_SLOT" || true
    docker rm "autoflow-$OLD_SLOT" || true

    exit 0
  fi

  echo "Attempt $i/$MAX_RETRIES: App on port $TARGET_PORT not ready yet. Retrying in ${SLEEP_INTERVAL}s..."
  sleep $SLEEP_INTERVAL
done

echo "Health check failed on target port $TARGET_PORT!"
exit 1