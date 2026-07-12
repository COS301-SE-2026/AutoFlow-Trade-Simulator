#!/bin/bash


CONTAINER_NAME="market_data_harvester"

CONTAINER_ID=$(docker ps --filter "name=${CONTAINER_NAME}" --format "{{.ID}}")

if [[ -z "$CONTAINER_ID" ]]; then
    echo "Error: No running container found with name '${CONTAINER_NAME}'." >&2
    exit 1
fi

echo "Stopping container ${CONTAINER_NAME} (${CONTAINER_ID})..."
docker stop "${CONTAINER_ID}"

if [[ $? -eq 0 ]]; then
    echo "Container stopped successfully."
else
    echo "Error: Failed to stop container." >&2
    exit 1
fi