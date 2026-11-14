# 🐳 ORS Docker & AWS Cloud Deployment Guide

This guide covers building production Docker images for **`ors-server`** (Spring Boot 3.4 / Java 21) and **`ors-frontend`** (Next.js 16 / Node.js 20), and deploying them to **Amazon Web Services (AWS)**.

---

## 📁 Files Created

| File | Location | Description |
| :--- | :--- | :--- |
| **Backend Dockerfile** | `ors-server/Dockerfile` | Multi-stage build (`eclipse-temurin:21`), non-root user, container JVM tuning, healthcheck |
| **Backend .dockerignore** | `ors-server/.dockerignore` | Excludes `target/`, IDE files, and logs |
| **Frontend Dockerfile** | `ors-frontend/Dockerfile` | Multi-stage build (`node:20-alpine`), Next.js standalone output, non-root user, healthcheck |
| **Frontend .dockerignore** | `ors-frontend/.dockerignore` | Excludes `node_modules/`, `.next/`, and local env files |
| **Full-Stack Compose** | `docker-compose.yml` | Complete orchestration of MySQL 8, `ors-server`, and `ors-frontend` |
| **AWS ECR Push Script (macOS/Linux)** | `deploy/build-and-push-ecr.sh` | Automated ECR login, multi-arch build, tag, and push |
| **AWS ECR Push Script (Windows)** | `deploy/build-and-push-ecr.bat` | Automated ECR login, build, tag, and push for Windows |

---

## 🚀 1. Quick Test Locally with Docker Compose

To test the entire production stack locally before pushing to AWS:

```bash
# 1. From the Sec_Project root directory, build and start all containers:
docker compose up --build -d

# 2. Check running container status and healthchecks:
docker compose ps

# 3. View live application logs:
docker compose logs -f

# 4. Access the applications:
# - Frontend: http://localhost:3000
# - Backend Health: http://localhost:8080/api/v1/health
# - MySQL Database: localhost:3307 (user: root, pass: ors2026)

# 5. Stop the containers:
docker compose down
```

---

## ☁️ 2. Build and Push Images to Amazon Elastic Container Registry (ECR)

### Prerequisites:
- [AWS CLI v2](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html) installed and configured (`aws configure`).
- Docker installed and running.

### Automated Method:
Run the deployment script from the project root:

```bash
# Set your AWS Account ID and preferred Region:
export AWS_ACCOUNT_ID=123456789012
export AWS_REGION=ap-southeast-1
export IMAGE_TAG=v1.0.0
export NEXT_PUBLIC_BASE_API="https://api.yourdomain.com" # or your ALB DNS

./deploy/build-and-push-ecr.sh
```

---

### Manual Step-by-Step Method:

#### Step 1: Authenticate Docker with AWS ECR
```bash
aws ecr get-login-password --region ap-southeast-1 | docker login --username AWS --password-stdin <AWS_ACCOUNT_ID>.dkr.ecr.ap-southeast-1.amazonaws.com
```

#### Step 2: Create ECR Repositories (One-Time)
```bash
aws ecr create-repository --repository-name ors-server --region ap-southeast-1
aws ecr create-repository --repository-name ors-frontend --region ap-southeast-1
```

#### Step 3: Build & Tag Backend Image
```bash
# Note: --platform linux/amd64 ensures compatibility with AWS x86 instances when building from an Apple Silicon Mac
docker build \
  --platform linux/amd64 \
  -t ors-server:latest \
  -t <AWS_ACCOUNT_ID>.dkr.ecr.ap-southeast-1.amazonaws.com/ors-server:latest \
  ./ors-server
```

#### Step 4: Build & Tag Frontend Image
```bash
docker build \
  --platform linux/amd64 \
  --build-arg NEXT_PUBLIC_BASE_API="https://api.yourdomain.com" \
  -t ors-frontend:latest \
  -t <AWS_ACCOUNT_ID>.dkr.ecr.ap-southeast-1.amazonaws.com/ors-frontend:latest \
  ./ors-frontend
```

#### Step 5: Push to Amazon ECR
```bash
docker push <AWS_ACCOUNT_ID>.dkr.ecr.ap-southeast-1.amazonaws.com/ors-server:latest
docker push <AWS_ACCOUNT_ID>.dkr.ecr.ap-southeast-1.amazonaws.com/ors-frontend:latest
```

---

## 🏗️ 3. Deploying to AWS Options

### Option A: AWS ECS (Elastic Container Service) with Fargate (Recommended)
1. **Database**: Create an **Amazon RDS MySQL 8.0+** instance in your private subnet.
2. **Task Definition**:
   - Create an ECS Task Definition with two containers: `ors-server` and `ors-frontend` (or separate tasks).
   - Configure Environment Variables for `ors-server`:
     - `SPRING_DATASOURCE_URL`: `jdbc:mysql://<rds-endpoint>:3306/orsdb?useSSL=true&serverTimezone=UTC`
     - `SPRING_DATASOURCE_USERNAME`: `<master-user>`
     - `SPRING_DATASOURCE_PASSWORD`: `<master-password>`
     - `APP_JWT_SECRET`: `<secure-256-bit-key>`
   - Configure Environment Variables for `ors-frontend`:
     - `BACKEND_API_URL`: `http://ors-server:8080` (via ECS Service Connect or internal ALB)
3. **Application Load Balancer (ALB)**:
   - Route `/api/*` to target group `ors-server` (port 8080).
   - Route `/*` to target group `ors-frontend` (port 3000).

### Option B: AWS App Runner (Fastest, Fully Managed)
1. Create an App Runner service pointing directly to `<AWS_ACCOUNT_ID>.dkr.ecr.<region>.amazonaws.com/ors-server:latest`. Port: `8080`.
2. Create a second App Runner service pointing to `<AWS_ACCOUNT_ID>.dkr.ecr.<region>.amazonaws.com/ors-frontend:latest`. Port: `3000`.

### Option C: AWS EC2 (Single VM / Docker Compose)
1. Launch an Amazon Linux 2023 or Ubuntu EC2 instance.
2. Install Docker & Docker Compose:
   ```bash
   sudo dnf install docker -y && sudo systemctl enable --now docker
   sudo usermod -aG docker ec2-user
   ```
3. Copy `docker-compose.yml` to the EC2 instance, populate `.env`, and run:
   ```bash
   docker compose up -d
   ```

---

## 🔒 4. Environment Variables Reference

### Backend (`ors-server`)
| Variable | Description | Example / Default |
| :--- | :--- | :--- |
| `SPRING_DATASOURCE_URL` | JDBC Connection String | `jdbc:mysql://rds-host:3306/orsdb?useSSL=true` |
| `SPRING_DATASOURCE_USERNAME`| Database username | `root` / `admin` |
| `SPRING_DATASOURCE_PASSWORD`| Database password | Stored in AWS Secrets Manager |
| `APP_JWT_SECRET` | 256-bit HMAC secret | `404E6352...` |
| `SERVER_PORT` | HTTP port for server | `8080` |

### Frontend (`ors-frontend`)
| Variable | Description | Example / Default |
| :--- | :--- | :--- |
| `BACKEND_API_URL` | Server-side rewrite URL | `http://ors-server:8080` or internal DNS |
| `NEXT_PUBLIC_BASE_API` | Client browser API base | `https://api.yourdomain.com` |
| `PORT` | Node.js listening port | `3000` |

