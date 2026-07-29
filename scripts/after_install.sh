#!/usr/bin/env bash
set -euo pipefail

# Ensure standard system paths are loaded for CodeDeploy's non-interactive shell
export PATH=$PATH:/usr/local/bin:/usr/bin:/bin

cd /home/ec2-user/autoflow

# Dynamically retrieve Region and AWS Account ID via IMDSv2
TOKEN=$(curl -s -X PUT "http://169.254.169.254/latest/api/token" -H "X-aws-ec2-metadata-token-ttl-seconds: 60")
AWS_REGION=$(curl -s -H "X-aws-ec2-metadata-token: $TOKEN" http://169.254.169.254/latest/meta-data/placement/region)
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

ECR_REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
IMAGE_URI="${ECR_REGISTRY}/autoflow-backend:latest"

echo "Detected Region: ${AWS_REGION}, Account ID: ${AWS_ACCOUNT_ID}"

# Authenticate Docker with ECR
echo "Logging in to AWS ECR..."
aws ecr get-login-password --region "${AWS_REGION}" | docker login --username AWS --password-stdin "${ECR_REGISTRY}"

# Pull latest image
echo "Pulling image: ${IMAGE_URI}..."
docker pull "${IMAGE_URI}"

# Determine target slot
ACTIVE_PORT=$(curl -s http://localhost/health | grep -oP '"port":\s*\K\d+' || echo "8002")

if [[ "$ACTIVE_PORT" -eq "8001" ]]; then
    TARGET_PORT=8002
    TARGET_SLOT="green"
else
    TARGET_PORT=8001
    TARGET_SLOT="blue"
fi

echo "Active port: $ACTIVE_PORT. Target slot: $TARGET_SLOT (Port $TARGET_PORT)"

# Write variables for subsequent lifecycle hooks (application_start.sh, validate_service.sh)
cat <<EOF > /tmp/deployment_slot.env
TARGET_PORT=${TARGET_PORT}
TARGET_SLOT=${TARGET_SLOT}
IMAGE_URI=${IMAGE_URI}
EOF