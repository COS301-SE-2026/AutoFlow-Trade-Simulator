#!/usr/bin/env bash
set -e

source /opt/codedeploy-agent/deployment-root/$DEPLOYMENT_GROUP_ID/$DEPLOYMENT_ID/deployment-archive/scripts/image.env
ECR_URI="$ECR_REGISTRY/$ECR_REPOSITORY"

ACTIVE_PORT=$(docker ps --filter "name=autoflow-backend" --format "{{.Ports}}" | grep -oP '0.0.0.0:\K(8001|8002)' || echo "none")

if [[ "$ACTIVE_PORT" == "8001" ]]; then
    TARGET_PORT=8002
    TARGET_NAME="autoflow-backend-green"
else
    TARGET_PORT=8001
    TARGET_NAME="autoflow-backend-blue"
fi

# Remove target container if it already exists (stopped or failed state)
docker rm -f "$TARGET_NAME" 2>/dev/null || true

docker run -d \
  --name "$TARGET_NAME" \
  -p $TARGET_PORT:8000 \
  --env-file /opt/autoflow/.env \
  "$ECR_URI:$IMAGE_TAG"

echo "TARGET_PORT=$TARGET_PORT" > /tmp/deployment_target.env
echo "TARGET_NAME=$TARGET_NAME" >> /tmp/deployment_target.env