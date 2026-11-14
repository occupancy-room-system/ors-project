#!/usr/bin/env bash
# ==============================================================================
# Script: build-and-push-ecr.sh
# Purpose: Build and push ORS Docker images to Amazon Elastic Container Registry (ECR)
# ==============================================================================

set -euo pipefail

# ------------------------------------------------------------------------------
# 1. Configuration (Edit these or pass as environment variables)
# ------------------------------------------------------------------------------
AWS_REGION="${AWS_REGION:-ap-southeast-1}"                    # e.g., ap-southeast-1 (Singapore), us-east-1
AWS_ACCOUNT_ID="${AWS_ACCOUNT_ID:-}"                         # e.g., 123456789012
IMAGE_TAG="${IMAGE_TAG:-latest}"                             # e.g., v1.0.0 or latest
TARGET_PLATFORM="${TARGET_PLATFORM:-linux/amd64}"            # Target architecture for AWS (linux/amd64 or linux/arm64)

# Public URL of backend API for frontend client-side calls (e.g., https://api.yourdomain.com or ALB DNS)
NEXT_PUBLIC_BASE_API="${NEXT_PUBLIC_BASE_API:-http://localhost:8080}"

# ------------------------------------------------------------------------------
# 2. Validation
# ------------------------------------------------------------------------------
if [ -z "$AWS_ACCOUNT_ID" ]; then
  echo "❌ Error: AWS_ACCOUNT_ID is not set."
  echo "Usage: AWS_ACCOUNT_ID=123456789012 AWS_REGION=ap-southeast-1 ./deploy/build-and-push-ecr.sh"
  exit 1
fi

ECR_REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
SERVER_REPO="ors-server"
FRONTEND_REPO="ors-frontend"

echo "======================================================================"
echo "🚀 ORS AWS ECR Deployment Build"
echo "======================================================================"
echo "  AWS Region:        ${AWS_REGION}"
echo "  AWS Account ID:    ${AWS_ACCOUNT_ID}"
echo "  ECR Registry:      ${ECR_REGISTRY}"
echo "  Image Tag:         ${IMAGE_TAG}"
echo "  Target Platform:   ${TARGET_PLATFORM}"
echo "  Frontend API URL:  ${NEXT_PUBLIC_BASE_API}"
echo "======================================================================"

# ------------------------------------------------------------------------------
# 3. Authenticate Docker with AWS ECR
# ------------------------------------------------------------------------------
echo ""
echo "🔑 [1/5] Authenticating Docker with AWS ECR..."
aws ecr get-login-password --region "${AWS_REGION}" | docker login --username AWS --password-stdin "${ECR_REGISTRY}"

# ------------------------------------------------------------------------------
# 4. Ensure ECR Repositories Exist
# ------------------------------------------------------------------------------
echo ""
echo "📦 [2/5] Verifying ECR repositories..."
aws ecr describe-repositories --repository-names "${SERVER_REPO}" --region "${AWS_REGION}" >/dev/null 2>&1 || \
  aws ecr create-repository --repository-name "${SERVER_REPO}" --region "${AWS_REGION}" >/dev/null

aws ecr describe-repositories --repository-names "${FRONTEND_REPO}" --region "${AWS_REGION}" >/dev/null 2>&1 || \
  aws ecr create-repository --repository-name "${FRONTEND_REPO}" --region "${AWS_REGION}" >/dev/null

# ------------------------------------------------------------------------------
# 5. Build and Tag Backend (ors-server)
# ------------------------------------------------------------------------------
echo ""
echo "🔨 [3/5] Building and tagging ors-server image (${TARGET_PLATFORM})..."
docker build \
  --platform "${TARGET_PLATFORM}" \
  -t "${SERVER_REPO}:${IMAGE_TAG}" \
  -t "${ECR_REGISTRY}/${SERVER_REPO}:${IMAGE_TAG}" \
  ./ors-server

# ------------------------------------------------------------------------------
# 6. Build and Tag Frontend (ors-frontend)
# ------------------------------------------------------------------------------
echo ""
echo "🔨 [4/5] Building and tagging ors-frontend image (${TARGET_PLATFORM})..."
docker build \
  --platform "${TARGET_PLATFORM}" \
  --build-arg NEXT_PUBLIC_BASE_API="${NEXT_PUBLIC_BASE_API}" \
  -t "${FRONTEND_REPO}:${IMAGE_TAG}" \
  -t "${ECR_REGISTRY}/${FRONTEND_REPO}:${IMAGE_TAG}" \
  ./ors-frontend

# ------------------------------------------------------------------------------
# 7. Push Images to AWS ECR
# ------------------------------------------------------------------------------
echo ""
echo "📤 [5/5] Pushing images to Amazon ECR..."
docker push "${ECR_REGISTRY}/${SERVER_REPO}:${IMAGE_TAG}"
docker push "${ECR_REGISTRY}/${FRONTEND_REPO}:${IMAGE_TAG}"

echo ""
echo "======================================================================"
echo "✅ Successfully built and pushed ORS images to AWS ECR!"
echo "   - Backend:  ${ECR_REGISTRY}/${SERVER_REPO}:${IMAGE_TAG}"
echo "   - Frontend: ${ECR_REGISTRY}/${FRONTEND_REPO}:${IMAGE_TAG}"
echo "======================================================================"

