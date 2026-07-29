#!/usr/bin/env bash
set -e
source /tmp/deployment_target.env

HEALTHY=false
for i in {1..10}; do
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:$TARGET_PORT/health || echo "000")
    if [[ "$RESPONSE" == "200" ]]; then
        HEALTHY=true
        break
    fi
    sleep 3
done

if [[ "$HEALTHY" != "true" ]]; then
    echo "Health check failed on port $TARGET_PORT. Aborting deployment."
    # Clean up the broken container so it doesn't leak resources
    docker stop "$TARGET_NAME" && docker rm "$TARGET_NAME"
    exit 1
fi

sed -i "s/proxy_pass http:\/\/127.0.0.1:[0-9]\{4\};/proxy_pass http:\/\/127.0.0.1:$TARGET_PORT;/" /etc/nginx/conf.d/autoflow.conf
systemctl reload nginx

OLD_CONTAINER=$(docker ps -q --filter "name=autoflow-backend" | grep -v "$TARGET_NAME" || true)
if [[ -n "$OLD_CONTAINER" ]]; then
    docker stop "$OLD_CONTAINER"
    docker rm "$OLD_CONTAINER"
fi