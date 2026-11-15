# 🐳 ORS Docker & EC2 Deployment Guide

This guide covers building production Docker images for **`ors-server`** (Spring Boot 3.4 / Java 21) and **`ors-frontend`** (Next.js 16 / Node.js 20), pushing them to a **private Docker registry**, and deploying to an **AWS EC2** instance.

---

## 📁 Files

| File | Description |
| :--- | :--- |
| `ors-server/Dockerfile` | Multi-stage build (`eclipse-temurin:21`), non-root user, healthcheck |
| `ors-frontend/Dockerfile` | Multi-stage build (`node:20-alpine`), Next.js standalone, healthcheck |
| `docker-compose.yml` | Full-stack local development (builds from source) |
| `deploy/build-and-push.sh` | Build & push images to any Docker registry |
| `deploy/ec2/setup-ec2.sh` | One-time EC2 instance setup (Docker, Compose) |
| `deploy/ec2/deploy-ec2.sh` | Pull from registry & deploy (supports `--rollback`) |
| `deploy/ec2/docker-compose.prod.yml` | Production compose using pre-built registry images |
| `.github/workflows/deploy-ec2.yml` | CI/CD: build → push → SSH deploy to EC2 |

---

## 🚀 1. Quick Test Locally with Docker Compose

```bash
# Build and start all containers from source:
docker compose up --build -d

# Check status:
docker compose ps

# Access:
# - Frontend: http://localhost:3000
# - Backend:  http://localhost:8080/api/v1/health
# - MySQL:    localhost:3307 (root / ors2026)

# Stop:
docker compose down
```

---

## ☁️ 2. Build and Push Images to Private Registry

### Prerequisites
- Docker installed and running
- A private Docker registry account (Docker Hub, GHCR, or self-hosted)

### Configure `.env`

```bash
DOCKER_REGISTRY=docker.io          # or ghcr.io, registry.example.com:5000
DOCKER_USERNAME=your-username
DOCKER_REPO=ors
IMAGE_TAG=latest
```

### Build & Push

```bash
# Using the automated script (reads from .env):
./deploy/build-and-push.sh

# Override tag:
IMAGE_TAG=v1.0.0 ./deploy/build-and-push.sh
```

This produces:
- `docker.io/your-username/ors:server-latest`
- `docker.io/your-username/ors:frontend-latest`

---

## 🏗️ 3. Deploy to AWS EC2

### Step 1: Launch EC2 Instance

- **AMI**: Amazon Linux 2023 or Ubuntu 22.04+
- **Instance Type**: `t3.medium` recommended
- **Security Group**: Allow inbound TCP `22`, `3000`, `8080`

### Step 2: Setup EC2 (One-Time)

```bash
scp -i ors-key.pem deploy/ec2/setup-ec2.sh ubuntu@54.253.77.235:~
ssh -i ors-key.pem ubuntu@54.253.77.235 './setup-ec2.sh'
```

### Step 3: Login to Docker Registry on EC2

```bash
ssh -i ors-key.pem ubuntu@54.253.77.235
docker login
```

### Step 4: Copy Deployment Files

```bash
scp -i ors-key.pem deploy/ec2/deploy-ec2.sh deploy/ec2/docker-compose.prod.yml ubuntu@54.253.77.235:~/ors-app/
```

### Step 5: Configure Environment

```bash
ssh -i ors-key.pem ubuntu@54.253.77.235
nano ~/ors-app/.env
# Set DOCKER_USERNAME, NEXT_PUBLIC_BASE_API=http://54.253.77.235:8080, passwords, etc.
```

### Step 6: Deploy

```bash
cd ~/ors-app && ./deploy-ec2.sh
```

### Rollback

```bash
./deploy-ec2.sh --rollback
```

---

## 🔄 4. Automated CI/CD with GitHub Actions

`.github/workflows/deploy-ec2.yml` automatically:
1. Builds Docker images on push to `main`
2. Pushes to your private Docker registry
3. SSHs into EC2 and deploys

### Required GitHub Secrets

| Secret | Description |
| :--- | :--- |
| `DOCKER_USERNAME` | Docker registry username |
| `DOCKER_PASSWORD` | Docker registry password / access token |
| `EC2_HOST` | Public IP or DNS of your EC2 instance |
| `EC2_USER` | SSH username (`ec2-user` or `ubuntu`) |
| `EC2_SSH_KEY` | Private SSH key (PEM content) |

### Optional GitHub Variables

| Variable | Default | Description |
| :--- | :--- | :--- |
| `DOCKER_REGISTRY` | `docker.io` | Docker registry URL |
| `DOCKER_USERNAME` | — | Registry username |
| `DOCKER_REPO` | `ors` | Repository name |
| `NEXT_PUBLIC_BASE_API` | *(empty)* | Public backend URL for browsers |

---

## 🔒 5. Environment Variables Reference

### Backend (`ors-server`)
| Variable | Description | Default |
| :--- | :--- | :--- |
| `SPRING_DATASOURCE_URL` | JDBC Connection String | `jdbc:mysql://ors-db:3306/orsdb` |
| `SPRING_DATASOURCE_USERNAME` | Database username | `root` |
| `SPRING_DATASOURCE_PASSWORD` | Database password | `ors2026` |
| `APP_JWT_SECRET` | 256-bit HMAC secret | `404E6352...` |
| `SERVER_PORT` | HTTP port | `8080` |

### Frontend (`ors-frontend`)
| Variable | Description | Default |
| :--- | :--- | :--- |
| `BACKEND_API_URL` | Server-side proxy URL | `http://ors-server:8080` |
| `NEXT_PUBLIC_BASE_API` | Client browser API base | `http://localhost:8080` |
| `PORT` | Node.js listening port | `3000` |
