#!/usr/bin/env bash
# ==============================================================================
# Script: build-and-push.sh
# Purpose: Build and push ORS Docker images to a private Docker registry
#          Works with Docker Hub, GHCR, or any self-hosted registry.
#
# Usage:   ./deploy/build-and-push.sh
#          IMAGE_TAG=v1.0.0 ./deploy/build-and-push.sh
# ==============================================================================

set -euo pipefail

# Capture any CLI-passed overrides before sourcing .env
CLI_NEXT_PUBLIC_BASE_API="${NEXT_PUBLIC_BASE_API:-}"

# ------------------------------------------------------------------------------
# 1. Directory Resolution & Load .env
# ------------------------------------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

ENV_FILE=""
if [ -f "${SCRIPT_DIR}/.env" ]; then
  ENV_FILE="${SCRIPT_DIR}/.env"
elif [ -f "${PROJECT_ROOT}/.env" ]; then
  ENV_FILE="${PROJECT_ROOT}/.env"
elif [ -f "$(pwd)/.env" ]; then
  ENV_FILE="$(pwd)/.env"
fi

if [ -n "${ENV_FILE}" ]; then
  echo "📄 Loading configuration from: ${ENV_FILE}"
  set -a
  # shellcheck disable=SC1090
  source "${ENV_FILE}"
  set +a
else
  echo "⚠️  No .env file found. Falling back to environment variables."
fi

# ------------------------------------------------------------------------------
# 2. Configuration
# ------------------------------------------------------------------------------
DOCKER_REGISTRY="${DOCKER_REGISTRY:-docker.io}"
DOCKER_USERNAME="${DOCKER_USERNAME:-}"
DOCKER_REPO="${DOCKER_REPO:-ors}"
IMAGE_TAG="${IMAGE_TAG:-latest}"
TARGET_PLATFORM="${TARGET_PLATFORM:-linux/amd64}"
# Allow CLI environment variables to override .env
NEXT_PUBLIC_BASE_API="${CLI_NEXT_PUBLIC_BASE_API:-${NEXT_PUBLIC_BASE_API:-http://localhost:8080}}"

# Build the full image prefix: registry/username/repo
if [ -n "${DOCKER_USERNAME}" ]; then
  IMAGE_PREFIX="${DOCKER_REGISTRY}/${DOCKER_USERNAME}/${DOCKER_REPO}"
else
  IMAGE_PREFIX="${DOCKER_REGISTRY}/${DOCKER_REPO}"
fi

SERVER_TAG_FULL="${IMAGE_PREFIX}:server-${IMAGE_TAG}"
SERVER_TAG_LATEST="${IMAGE_PREFIX}:server-latest"

FRONTEND_TAG_FULL="${IMAGE_PREFIX}:frontend-${IMAGE_TAG}"
FRONTEND_TAG_LATEST="${IMAGE_PREFIX}:frontend-latest"

# ------------------------------------------------------------------------------
# 3. Validation
# ------------------------------------------------------------------------------
if [ -z "${DOCKER_USERNAME}" ]; then
  echo "❌ Error: DOCKER_USERNAME is not set. Configure it in .env or environment."
  exit 1
fi

echo "======================================================================"
echo "🚀 ORS Docker Build & Push"
echo "======================================================================"
echo "  Registry:          ${DOCKER_REGISTRY}"
echo "  Username:          ${DOCKER_USERNAME}"
echo "  Repository:        ${DOCKER_REPO}"
echo "  Image Prefix:      ${IMAGE_PREFIX}"
echo "  Image Tag:         ${IMAGE_TAG}"
echo "  Target Platform:   ${TARGET_PLATFORM}"
echo "  Frontend API URL:  ${NEXT_PUBLIC_BASE_API}"
echo "  Project Root:      ${PROJECT_ROOT}"
echo "======================================================================"

# ------------------------------------------------------------------------------
# 4. Authenticate Docker with Registry
# ------------------------------------------------------------------------------
echo ""
echo "🔑 [1/4] Authenticating Docker with ${DOCKER_REGISTRY}..."

# Check if already logged in, otherwise prompt
if docker login "${DOCKER_REGISTRY}" 2>/dev/null; then
  echo "  ✅ Docker authentication successful."
else
  echo "  Please enter your registry credentials:"
  docker login "${DOCKER_REGISTRY}" --username "${DOCKER_USERNAME}"
fi

# ------------------------------------------------------------------------------
# 5. Build and Tag Backend (ors-server)
# ------------------------------------------------------------------------------
echo ""
echo "🔨 [2/4] Building ors-server image (${TARGET_PLATFORM})..."
docker build \
  --platform "${TARGET_PLATFORM}" \
  -t "ors-server:${IMAGE_TAG}" \
  -t "${SERVER_TAG_FULL}" \
  -t "${SERVER_TAG_LATEST}" \
  "${PROJECT_ROOT}/ors-server"

# ------------------------------------------------------------------------------
# 6. Build and Tag Frontend (ors-frontend)
# ------------------------------------------------------------------------------
echo ""
echo "🔨 [3/4] Building ors-frontend image (${TARGET_PLATFORM})..."
docker build \
  --platform "${TARGET_PLATFORM}" \
  --build-arg NEXT_PUBLIC_BASE_API="${NEXT_PUBLIC_BASE_API}" \
  -t "ors-frontend:${IMAGE_TAG}" \
  -t "${FRONTEND_TAG_FULL}" \
  -t "${FRONTEND_TAG_LATEST}" \
  "${PROJECT_ROOT}/ors-frontend"

# ------------------------------------------------------------------------------
# 7. Push Images to Registry
# ------------------------------------------------------------------------------
echo ""
echo "📤 [4/4] Pushing images to ${DOCKER_REGISTRY}..."

echo "  Pushing: ${SERVER_TAG_FULL}"
docker push "${SERVER_TAG_FULL}"
echo "  Pushing: ${SERVER_TAG_LATEST}"
docker push "${SERVER_TAG_LATEST}"

echo ""
echo "  Pushing: ${FRONTEND_TAG_FULL}"
docker push "${FRONTEND_TAG_FULL}"
echo "  Pushing: ${FRONTEND_TAG_LATEST}"
docker push "${FRONTEND_TAG_LATEST}"

echo ""
echo "======================================================================"
echo "✅ Successfully built and pushed ORS images!"
echo "   - Backend:  ${SERVER_TAG_FULL}"
echo "   - Frontend: ${FRONTEND_TAG_FULL}"
echo "======================================================================"
