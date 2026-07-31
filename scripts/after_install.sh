#!/usr/bin/env bash
set -e

echo "Fetching top-level environment variables from SSM under /autoflow/prod/..."
aws ssm get-parameters-by-path \
  --path "/autoflow/prod/" \
  --with-decryption \
  --query "Parameters[*].[Name,Value]" \
  --output text | awk -F'\t' '
    {
      key = $1;
      val = $2;
      sub("^/autoflow/prod/", "", key);
      sub("^/", "", key);
      if (key !~ /\// && key != "") {
        print key "=" val;
      }
    }
  ' > /opt/autoflow/.env

chmod 600 /opt/autoflow/.env

source /opt/codedeploy-agent/deployment-root/$DEPLOYMENT_GROUP_ID/$DEPLOYMENT_ID/deployment-archive/scripts/image.env
ECR_URI="$ECR_REGISTRY/$ECR_REPOSITORY"

aws ecr get-login-password --region "$AWS_REGION" | docker login --username AWS --password-stdin "$ECR_REGISTRY"

docker pull "$ECR_URI:$IMAGE_TAG"

docker run --rm \
  --network host \
  --env-file /opt/autoflow/.env \
  "$ECR_URI:$IMAGE_TAG" \
  alembic upgrade head