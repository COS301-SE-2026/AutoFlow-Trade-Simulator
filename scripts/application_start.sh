#!/usr/bin/env bash
set -euo pipefail

export PATH=$PATH:/usr/local/bin:/usr/bin:/bin
source /tmp/deployment_slot.env

echo "Starting container on target slot $TARGET_SLOT (Port $TARGET_PORT)..."

# Remove existing container on target slot if present
docker stop "autoflow-$TARGET_SLOT" || true
docker rm "autoflow-$TARGET_SLOT" || true

# Spin up target container
docker run -d \
  --name "autoflow-$TARGET_SLOT" \
  --restart unless-stopped \
  -p "$TARGET_PORT:8000" \
  --env-file /home/ec2-user/autoflow/.env \
  "$IMAGE_URI"

sleep 5

# Update Nginx reverse proxy configuration
echo "Updating Nginx upstream to port $TARGET_PORT..."
sudo sed -i "s/proxy_pass http:\/\/127\.0\.0\.1:[0-9]*/proxy_pass http:\/\/127\.0\.0\.1:$TARGET_PORT/" /etc/nginx/conf.d/autoflow.conf

# Reload Nginx without dropping active connections
sudo nginx -s reload