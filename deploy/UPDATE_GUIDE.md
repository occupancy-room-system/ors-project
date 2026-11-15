# 🔄 ORS Update & Deployment CLI Guide

This guide contains the exact CLI commands needed by team members to update, build, and deploy the **Occupancy Room System (ORS)** both locally and on the live AWS EC2 server.

---

## 💻 1. Local Development Updates

### Pull Latest Code from GitHub
```bash
git checkout main
git pull origin main
```

### Run Locally (3 Separate Terminals)
```bash
# Terminal 1: Database
cd ors-infra && ./startInfra.sh

# Terminal 2: Backend API (Port 8080)
cd ors-server && mvn spring-boot:run

# Terminal 3: Frontend Web (Port 3000)
cd ors-frontend && npm install && npm run dev
```

### Run & Test Full-Stack Locally with Docker
```bash
# Build and start all 3 containers
docker compose up --build -d

# Check running status & health
docker compose ps

# View live logs
docker compose logs -f

# Stop containers
docker compose down
```

---

## 🐳 2. Build & Push Production Images to Registry

Run from the project root on your local computer:

```bash
# 1. Login to Docker Hub (one-time)
docker login

# 2. Build and push both images (reads deploy/.env)
./deploy/build-and-push.sh

# (Optional) Build & push with a specific version tag:
IMAGE_TAG=v1.1.0 ./deploy/build-and-push.sh
```

---

## ☁️ 3. Deploy Updates to AWS EC2

### Step 1: Connect to EC2
```bash
ssh -i ors-key.pem ubuntu@54.253.77.235
```

### Step 2: Pull & Redeploy
```bash
cd ~/ors-app
./deploy-ec2.sh
```
*(Or deploy a specific version: `IMAGE_TAG=v1.1.0 ./deploy-ec2.sh`)*

### Step 3: Verify Status & Live Logs
```bash
# Check container status
docker compose -f docker-compose.prod.yml ps

# Follow live logs
docker compose -f docker-compose.prod.yml logs -f

# Test backend health directly on EC2
curl http://localhost:8080/api/v1/health
```

---

## ⏪ 4. Rollback (If an update has issues)

On your EC2 server, revert to the previous working version instantly:

```bash
cd ~/ors-app
./deploy-ec2.sh --rollback
```

---

## 🛠️ 5. Server Maintenance Commands (EC2)

```bash
# Restart all containers
docker compose -f docker-compose.prod.yml restart

# Restart only frontend
docker compose -f docker-compose.prod.yml restart ors-frontend

# Restart only backend
docker compose -f docker-compose.prod.yml restart ors-server

# Stop all containers
docker compose -f docker-compose.prod.yml down

# Clean up unused Docker images to free disk space
docker image prune -f
```
