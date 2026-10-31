# Team Development Setup Guide

> 💡 **New Team Members:** A detailed, step-by-step modular guide is available in the [**`instructions/`**](../instructions/README.md) directory. See [**COMPLETE_SETUP_GUIDE.md**](../instructions/COMPLETE_SETUP_GUIDE.md) for full instructions.

---

## 1. Prerequisites
- Docker Engine 24.x+ & Docker Desktop
- Java 21 JDK (or Java 17)
- Node.js 20.x or 22.x LTS
- Git

---

## 2. Infrastructure Setup (MySQL 8 on Port 3307)

1. Open a terminal in `ors-infra/`:
   ```bash
   cd ors-infra
   ```

2. Start the MySQL container:
   ```bash
   ./startInfra.sh
   # On Windows: startInfra.bat
   # Or manually: docker compose up -d
   ```

3. Confirm database readiness:
   ```bash
   docker ps -f name=ors-db
   ```

4. Host port mapping rule:
   - Host machine connects to MySQL on **port 3307** (`localhost:3307`).
   - Container internal port is **3306**.
   - Database name: `orsdb`, Credentials: `root / ors2026`.

---

## 3. Backend Setup (Spring Boot)

1. Navigate to `ors-server/`:
   ```bash
   cd ors-server
   ```

2. Build and run Spring Boot:
   ```bash
   ./mvnw spring-boot:run
   # On Windows: mvnw.cmd spring-boot:run
   ```

3. Verify Spring Boot is running:
   - Health endpoint: `http://localhost:8080/api/v1/health`
   - Floor plan endpoint: `http://localhost:8080/api/v1/rooms/1/map`

---

## 4. Web Frontend Setup (Next.js)

1. Navigate to `ors-frontend/`:
   ```bash
   cd ors-frontend
   npm install
   npm run dev
   ```

2. Open `http://localhost:3000` in your web browser.

---

## 5. Default Demonstration Credentials

| Role | Name | Email | Password |
|---|---|---|---|
| **Administrator** | Prof. Robert Vance | `admin@university.edu` | `AdminPass123!` |
| **Student** | Alex Chen | `alex.chen@student.university.edu` | `StudentPass123!` |
| **Student** | Sarah Kim | `sarah.kim@student.university.edu` | `StudentPass123!` |

---

## 6. Resetting Development Data

To safely wipe and recreate the database with clean seed data:
```bash
cd ors-infra
docker compose down -v
./startInfra.sh
```
