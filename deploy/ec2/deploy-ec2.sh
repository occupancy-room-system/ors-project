#!/usr/bin/env bash
# ==============================================================================
# Script: deploy-ec2.sh
# Purpose: Pull Docker images from a private registry and deploy on EC2
#          using docker compose. Works with Docker Hub, GHCR, or self-hosted.
#
# Usage:   ./deploy-ec2.sh                 # Deploy with defaults from .env
#          IMAGE_TAG=v1.0.0 ./deploy-ec2.sh  # Deploy a specific tag
#          ./deploy-ec2.sh --rollback      # Rollback to the previous version
# ==============================================================================

set -euo pipefail

# ------------------------------------------------------------------------------
# 1. Directory Resolution & Load .env
# ------------------------------------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

ENV_FILE=""
if [ -f "${SCRIPT_DIR}/.env" ]; then
  ENV_FILE="${SCRIPT_DIR}/.env"
elif [ -f "${HOME}/ors-app/.env" ]; then
  ENV_FILE="${HOME}/ors-app/.env"
fi

if [ -n "${ENV_FILE}" ]; then
  echo "📄 Loading configuration from: ${ENV_FILE}"
  set -a
  # shellcheck disable=SC1090
  source "${ENV_FILE}"
  set +a
else
  echo "⚠️  No .env file found. Using environment variables."
fi

# ------------------------------------------------------------------------------
# 2. Configuration
# ------------------------------------------------------------------------------
DOCKER_REGISTRY="${DOCKER_REGISTRY:-docker.io}"
DOCKER_USERNAME="${DOCKER_USERNAME:-}"
DOCKER_REPO="${DOCKER_REPO:-ors}"
IMAGE_TAG="${IMAGE_TAG:-latest}"

# Build full image prefix
if [ -n "${DOCKER_USERNAME}" ]; then
  IMAGE_PREFIX="${DOCKER_REGISTRY}/${DOCKER_USERNAME}/${DOCKER_REPO}"
else
  IMAGE_PREFIX="${DOCKER_REGISTRY}/${DOCKER_REPO}"
fi

SERVER_IMAGE="${IMAGE_PREFIX}:server-${IMAGE_TAG}"
FRONTEND_IMAGE="${IMAGE_PREFIX}:frontend-${IMAGE_TAG}"

COMPOSE_FILE="${SCRIPT_DIR}/docker-compose.prod.yml"
BACKUP_TAG_FILE="${SCRIPT_DIR}/.last-deployed-tag"

# ------------------------------------------------------------------------------
# 3. Parse Arguments
# ------------------------------------------------------------------------------
ROLLBACK=false
for arg in "$@"; do
  case "$arg" in
    --rollback)
      ROLLBACK=true
      ;;
  esac
done

# Handle rollback
if [ "$ROLLBACK" = true ]; then
  if [ -f "${BACKUP_TAG_FILE}" ]; then
    PREV_TAG=$(cat "${BACKUP_TAG_FILE}")
    echo "🔄 Rolling back to previous tag: ${PREV_TAG}"
    IMAGE_TAG="${PREV_TAG}"
    SERVER_IMAGE="${IMAGE_PREFIX}:server-${IMAGE_TAG}"
    FRONTEND_IMAGE="${IMAGE_PREFIX}:frontend-${IMAGE_TAG}"
  else
    echo "❌ No previous deployment tag found. Cannot rollback."
    exit 1
  fi
fi

# ------------------------------------------------------------------------------
# 4. Validation
# ------------------------------------------------------------------------------
if [ -z "${DOCKER_USERNAME}" ]; then
  echo "❌ Error: DOCKER_USERNAME is required. Set it in .env or environment."
  exit 1
fi

if ! command -v docker &>/dev/null; then
  echo "❌ Error: Docker is not installed. Run setup-ec2.sh first."
  exit 1
fi

echo "======================================================================"
echo "🚀 ORS EC2 Deployment"
echo "======================================================================"
echo "  Registry:          ${DOCKER_REGISTRY}"
echo "  Image Prefix:      ${IMAGE_PREFIX}"
echo "  Server Image:      ${SERVER_IMAGE}"
echo "  Frontend Image:    ${FRONTEND_IMAGE}"
echo "  Compose File:      ${COMPOSE_FILE}"
echo "======================================================================"

# ------------------------------------------------------------------------------
# 5. Authenticate Docker with Registry
# ------------------------------------------------------------------------------
echo ""
echo "🔑 [1/4] Authenticating Docker with ${DOCKER_REGISTRY}..."
docker login "${DOCKER_REGISTRY}" 2>/dev/null || docker login "${DOCKER_REGISTRY}" --username "${DOCKER_USERNAME}"
echo "  ✅ Authentication successful."

# ------------------------------------------------------------------------------
# 6. Pull Latest Images
# ------------------------------------------------------------------------------
echo ""
echo "📥 [2/4] Pulling images from registry..."
echo "  Pulling: ${SERVER_IMAGE}"
docker pull "${SERVER_IMAGE}"

echo "  Pulling: ${FRONTEND_IMAGE}"
docker pull "${FRONTEND_IMAGE}"

echo "  ✅ All images pulled successfully."

# ------------------------------------------------------------------------------
# 7. Save Current Tag for Rollback & Generate Compose File
# ------------------------------------------------------------------------------
echo ""
echo "📝 [3/4] Preparing deployment..."

# Save current running tag for potential rollback
if [ -f "${BACKUP_TAG_FILE}" ] && [ "$ROLLBACK" = false ]; then
  cp "${BACKUP_TAG_FILE}" "${BACKUP_TAG_FILE}.bak"
fi
if [ "$ROLLBACK" = false ]; then
  echo "${IMAGE_TAG}" > "${BACKUP_TAG_FILE}"
fi

# Generate the production docker-compose file if it doesn't exist
if [ ! -f "${COMPOSE_FILE}" ]; then
  echo "  Generating ${COMPOSE_FILE}..."
  cat > "${COMPOSE_FILE}" <<COMPOSEEOF
services:
  # ===========================================================================
  # 1. MySQL 8 Database
  # ===========================================================================
  ors-db:
    image: mysql:8.4
    container_name: ors-db
    restart: unless-stopped
    ports:
      - "3306:3306"
    environment:
      MYSQL_ROOT_PASSWORD: \${DB_ROOT_PASSWORD:-ors2026}
      MYSQL_DATABASE: \${DB_NAME:-orsdb}
    volumes:
      - mysql_data:/var/lib/mysql
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost", "-u", "root", "-p\${DB_ROOT_PASSWORD:-ors2026}"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 20s
    networks:
      - ors-network

  # ===========================================================================
  # 2. Spring Boot Backend
  # ===========================================================================
  ors-server:
    image: \${DOCKER_REGISTRY:-docker.io}/\${DOCKER_USERNAME}/\${DOCKER_REPO:-ors}:server-\${IMAGE_TAG:-latest}
    container_name: ors-server
    restart: unless-stopped
    ports:
      - "8080:8080"
    environment:
      SPRING_DATASOURCE_URL: jdbc:mysql://ors-db:3306/\${DB_NAME:-orsdb}?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC
      SPRING_DATASOURCE_USERNAME: \${DB_USER:-root}
      SPRING_DATASOURCE_PASSWORD: \${DB_ROOT_PASSWORD:-ors2026}
      APP_JWT_SECRET: \${APP_JWT_SECRET:-404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970}
      APP_JWT_EXPIRATION_MS: \${APP_JWT_EXPIRATION_MS:-86400000}
      SERVER_PORT: 8080
      SPRING_JPA_HIBERNATE_DDL_AUTO: \${SPRING_JPA_HIBERNATE_DDL_AUTO:-update}
    depends_on:
      ors-db:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:8080/api/v1/health"]
      interval: 15s
      timeout: 5s
      retries: 3
      start_period: 45s
    networks:
      - ors-network

  # ===========================================================================
  # 3. Next.js Frontend
  # ===========================================================================
  ors-frontend:
    image: \${DOCKER_REGISTRY:-docker.io}/\${DOCKER_USERNAME}/\${DOCKER_REPO:-ors}:frontend-\${IMAGE_TAG:-latest}
    container_name: ors-frontend
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      PORT: 3000
      BACKEND_API_URL: http://ors-server:8080
    depends_on:
      ors-server:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3000"]
      interval: 15s
      timeout: 5s
      retries: 3
      start_period: 25s
    networks:
      - ors-network

volumes:
  mysql_data:
    driver: local

networks:
  ors-network:
    driver: bridge
COMPOSEEOF
fi

echo "  ✅ Deployment prepared."

# ------------------------------------------------------------------------------
# 8. Deploy with Docker Compose
# ------------------------------------------------------------------------------
echo ""
echo "🚀 [4/4] Deploying services..."

# Export variables for docker-compose interpolation
export DOCKER_REGISTRY DOCKER_USERNAME DOCKER_REPO IMAGE_TAG

# Stop existing containers gracefully
docker compose -f "${COMPOSE_FILE}" down --remove-orphans 2>/dev/null || true

# Start all services
docker compose -f "${COMPOSE_FILE}" up -d

echo ""
echo "⏳ Waiting for services to become healthy..."
sleep 5

# Wait for health checks (up to 90 seconds)
TIMEOUT=90
ELAPSED=0
while [ $ELAPSED -lt $TIMEOUT ]; do
  SERVER_HEALTH=$(docker inspect --format='{{.State.Health.Status}}' ors-server 2>/dev/null || echo "starting")
  FRONTEND_HEALTH=$(docker inspect --format='{{.State.Health.Status}}' ors-frontend 2>/dev/null || echo "starting")
  DB_HEALTH=$(docker inspect --format='{{.State.Health.Status}}' ors-db 2>/dev/null || echo "starting")

  echo "  [${ELAPSED}s] DB: ${DB_HEALTH} | Server: ${SERVER_HEALTH} | Frontend: ${FRONTEND_HEALTH}"

  if [ "$DB_HEALTH" = "healthy" ] && [ "$SERVER_HEALTH" = "healthy" ] && [ "$FRONTEND_HEALTH" = "healthy" ]; then
    break
  fi

  sleep 10
  ELAPSED=$((ELAPSED + 10))
done

echo ""
echo "======================================================================"
echo "📊 Deployment Status"
echo "======================================================================"
docker compose -f "${COMPOSE_FILE}" ps
echo ""

# Final health verification
SERVER_HEALTH=$(docker inspect --format='{{.State.Health.Status}}' ors-server 2>/dev/null || echo "unknown")
FRONTEND_HEALTH=$(docker inspect --format='{{.State.Health.Status}}' ors-frontend 2>/dev/null || echo "unknown")

if [ "$SERVER_HEALTH" = "healthy" ] && [ "$FRONTEND_HEALTH" = "healthy" ]; then
  # IMDSv2 (token-based) → fallback to IMDSv1 → fallback to placeholder
  IMDS_TOKEN=$(curl -s --max-time 2 -X PUT "http://169.254.169.254/latest/api/token" -H "X-aws-ec2-metadata-token-ttl-seconds: 60" 2>/dev/null || true)
  if [ -n "${IMDS_TOKEN}" ]; then
    EC2_PUBLIC_IP=$(curl -s --max-time 3 -H "X-aws-ec2-metadata-token: ${IMDS_TOKEN}" http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || echo "")
  else
    EC2_PUBLIC_IP=$(curl -s --max-time 3 http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || echo "")
  fi
  EC2_PUBLIC_IP="${EC2_PUBLIC_IP:-<EC2_PUBLIC_IP>}"
  echo "✅ Deployment Successful!"
  echo ""
  echo "🌐 Access your application:"
  echo "   Frontend:       http://${EC2_PUBLIC_IP}:3000"
  echo "   Backend API:    http://${EC2_PUBLIC_IP}:8080/api/v1/health"
  echo "   Admin Panel:    http://${EC2_PUBLIC_IP}:3000/admin"
else
  echo "⚠️  Some services may still be starting. Check logs with:"
  echo "   docker compose -f ${COMPOSE_FILE} logs -f"
fi

echo ""
echo "📋 Useful Commands:"
echo "   View logs:       docker compose -f ${COMPOSE_FILE} logs -f"
echo "   Stop services:   docker compose -f ${COMPOSE_FILE} down"
echo "   Restart:         docker compose -f ${COMPOSE_FILE} restart"
echo "   Rollback:        ./deploy-ec2.sh --rollback"
echo "======================================================================"
