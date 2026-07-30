#!/usr/bin/env bash
set -e

# Source the deployment variables injected by GitHub Actions
source /opt/codedeploy-agent/deployment-root/$DEPLOYMENT_GROUP_ID/$DEPLOYMENT_ID/deployment-archive/scripts/image.env
ECR_URI="$ECR_REGISTRY/$ECR_REPOSITORY"

# 1. Login to ECR using the dynamic region variable
aws ecr get-login-password --region "$AWS_REGION" | docker login --username AWS --password-stdin "$ECR_REGISTRY"

# 2. Pull the exact commit SHA
docker pull "$ECR_URI:$IMAGE_TAG"

# 3. Execute DB Migrations using the new image BEFORE it starts serving traffic
docker run --rm \
  --env-file /path/to/your/production/.env \
  "$ECR_URI:$IMAGE_TAG" \
  alembic upgrade head