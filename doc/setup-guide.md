# Team Development Setup Guide

This guide ensures every teammate on macOS, Windows (WSL2), or Linux can run the project reproducibly.

---

## 1. Prerequisites
- Docker Engine 24.x+ & Docker Compose v2.x
- Java 17 or 21 JDK
- Node.js 20.x or 22.x
- Git

---

## 2. Infrastructure Setup (MySQL 8 on Port 3307)

1. Open a terminal in `docker-infra/`:
   ```bash
   cd docker-infra
   cp .env.example .env
   ```

2. Start the MySQL container:
   ```bash
   ./scripts/start-db.sh
   # Or manually:
   docker compose up -d
   ```

3. Confirm database readiness:
   ```bash
   docker compose ps
   # STATUS should say: Up (healthy)
   ```

4. Host port mapping rule:
   - Host machine connects to MySQL on **port 3307** (`localhost:3307`).
   - Container-to-container connections use **port 3306** (`mysql:3306`).

---

## 3. Backend Setup (Spring Boot)

1. Navigate to `backend/`:
   ```bash
   cd ../backend
   ```

2. Build and run Spring Boot (Flyway migrations run automatically on startup):
   ```bash
   ./mvnw spring-boot:run
   ```

3. Verify Spring Boot is running:
   - Health endpoint: `http://localhost:8080/api/v1/health`
   - Swagger OpenAPI Docs: `http://localhost:8080/swagger-ui.html`

---

## 4. Web Frontend Setup

1. From the project root:
   ```bash
   npm install
   npm run dev
   ```

2. Open `http://localhost:3000` in your web browser.

---

## 5. Default Demonstration Credentials

| Role | Email | Password |
|---|---|---|
| **Administrator** | `admin@university.edu` | `AdminPass123!` |
| **Student** | `alex.chen@student.university.edu` | `StudentPass123!` |
| **Student** | `sarah.kim@student.university.edu` | `StudentPass123!` |

---

## 6. Resetting Development Data

To safely wipe and recreate the database with clean seed data:
```bash
cd docker-infra
./scripts/reset-db.sh
```
*(Prompts for confirmation before destroying the persistent volume).*
