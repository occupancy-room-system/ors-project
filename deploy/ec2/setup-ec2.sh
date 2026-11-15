#!/usr/bin/env bash
# ==============================================================================
# Script: setup-ec2.sh
# Purpose: One-time setup of a fresh EC2 instance (Amazon Linux 2023 or Ubuntu)
#          Installs Docker, Docker Compose, and creates app directory.
#
# Usage:   scp deploy/ec2/setup-ec2.sh ec2-user@<EC2_IP>:~
#          ssh ec2-user@<EC2_IP> './setup-ec2.sh'
# ==============================================================================

set -euo pipefail

echo "======================================================================"
echo "🖥️  ORS EC2 Instance Setup"
echo "======================================================================"

# ------------------------------------------------------------------------------
# 1. Detect OS
# ------------------------------------------------------------------------------
OS=""
if [ -f /etc/os-release ]; then
  . /etc/os-release
  case "$ID" in
    amzn|al2023) OS="amazon" ;;
    ubuntu|debian) OS="ubuntu" ;;
    *) OS="$ID" ;;
  esac
fi

echo "📋 Detected OS: ${OS:-unknown}"

# ------------------------------------------------------------------------------
# 2. Install Docker
# ------------------------------------------------------------------------------
echo ""
echo "🐳 [1/3] Installing Docker..."

if command -v docker &>/dev/null; then
  echo "  ✅ Docker already installed: $(docker --version)"
else
  case "$OS" in
    amazon)
      sudo dnf update -y
      sudo dnf install -y docker
      ;;
    ubuntu)
      sudo apt-get update -y
      sudo apt-get install -y ca-certificates curl gnupg
      sudo install -m 0755 -d /etc/apt/keyrings
      curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
      sudo chmod a+r /etc/apt/keyrings/docker.gpg
      echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
        sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
      sudo apt-get update -y
      sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
      ;;
    *)
      echo "❌ Unsupported OS: $OS. Please install Docker manually."
      exit 1
      ;;
  esac
fi

sudo systemctl enable --now docker
sudo usermod -aG docker "$(whoami)" || true
echo "  ✅ Docker installed and enabled."

# ------------------------------------------------------------------------------
# 3. Install Docker Compose (plugin or standalone)
# ------------------------------------------------------------------------------
echo ""
echo "📦 [2/3] Ensuring Docker Compose is available..."

if docker compose version &>/dev/null 2>&1; then
  echo "  ✅ Docker Compose plugin: $(docker compose version)"
elif command -v docker-compose &>/dev/null; then
  echo "  ✅ Docker Compose standalone: $(docker-compose --version)"
else
  echo "  Installing Docker Compose plugin..."
  COMPOSE_VERSION="v2.29.1"
  sudo mkdir -p /usr/local/lib/docker/cli-plugins
  sudo curl -fsSL "https://github.com/docker/compose/releases/download/${COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" \
    -o /usr/local/lib/docker/cli-plugins/docker-compose
  sudo chmod +x /usr/local/lib/docker/cli-plugins/docker-compose
  echo "  ✅ Docker Compose ${COMPOSE_VERSION} installed."
fi

# ------------------------------------------------------------------------------
# 4. Create Application Directory Structure
# ------------------------------------------------------------------------------
echo ""
echo "📂 [3/3] Creating application directory..."

APP_DIR="${HOME}/ors-app"
mkdir -p "${APP_DIR}"

# Create a template .env if it doesn't exist
if [ ! -f "${APP_DIR}/.env" ]; then
  cat > "${APP_DIR}/.env" <<'ENVEOF'
# ==============================================================================
# ORS EC2 Deployment Configuration
# Fill in the values below before running deploy-ec2.sh
# ==============================================================================

# --- Docker Registry ---
# Docker Hub: docker.io  |  GHCR: ghcr.io  |  Self-hosted: registry.example.com:5000
DOCKER_REGISTRY=docker.io
DOCKER_USERNAME=your-dockerhub-username
DOCKER_REPO=ors
IMAGE_TAG=latest

# --- Database (MySQL 8) ---
DB_HOST=ors-db
DB_PORT=3306
DB_NAME=orsdb
DB_USER=root
DB_ROOT_PASSWORD=ors2026

# Spring Boot JDBC
SPRING_DATASOURCE_URL=jdbc:mysql://ors-db:3306/orsdb?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC
SPRING_DATASOURCE_USERNAME=root
SPRING_DATASOURCE_PASSWORD=ors2026

# --- Backend Security ---
SERVER_PORT=8080
APP_JWT_SECRET=404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970
APP_JWT_EXPIRATION_MS=86400000

# --- Frontend ---
PORT=3000
BACKEND_API_URL=http://ors-server:8080
NEXT_PUBLIC_BASE_API=http://localhost:8080
ENVEOF
  echo "  📝 Template .env created at ${APP_DIR}/.env — edit it before deploying."
else
  echo "  ✅ .env already exists at ${APP_DIR}/.env"
fi

echo ""
echo "======================================================================"
echo "✅ EC2 Setup Complete!"
echo "======================================================================"
echo ""
echo "📋 Next Steps:"
echo "  1. Log out and back in (or run: newgrp docker)"
echo "     so your user can run Docker without sudo."
echo ""
echo "  2. Log in to your Docker registry:"
echo "     docker login"
echo ""
echo "  3. Edit the .env file:"
echo "     nano ${APP_DIR}/.env"
echo ""
echo "  4. Copy docker-compose.prod.yml and deploy-ec2.sh to ${APP_DIR}/"
echo "     then run: ./deploy-ec2.sh"
echo "======================================================================"
