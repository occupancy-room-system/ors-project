# Occupancy Room System (ORS)

Occupancy Room System (ORS) is a modern, full-stack, enterprise-grade laboratory workstation occupancy and reservation system designed for University Software Engineering Laboratories. Students can check real-time seat occupancy from home or mobile before commuting, make short-advance reservations, scan physical desk QR codes on arrival to activate sessions, and manage their working hours. Laboratory administrators have access to live analytics, peak utilization graphs, usage telemetry over selectable date ranges, seat maintenance overrides, and printable QR sticker sheets.

> 📖 **Deployment & Update Guides:**  
> - [**Update & Deployment CLI Guide**](./deploy/UPDATE_GUIDE.md) — CLI commands for local updates, Docker build/push, and AWS EC2 deployments.  
> - [**Domain & SSL Setup Guide**](./deploy/DOMAIN_SETUP_README.md) — Step-by-step setup for custom domains, Nginx reverse proxy, and Let's Encrypt SSL.

---

## 👥 Group Members

```text
6831503001  Aung Kaung Set
6831503002  Aung Kyaw Min Htet
6831503003  Aung Myo Myint
6831503022  Kaung Sett Paing
6831503119  Bhone Pyae Ko
```

---

## 🛠️ Feature Responsibilities

| Student ID     | Member Name            | Responsible Features                                                                                                                                                                                                                                                                      |
| :------------- | :--------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **6831503001** | **Aung Kaung Set**     | **Frontend UI & Interactive Floor Plan:** 2D interactive lab floor plan (54 desks across stations A–E and group tables 1–5), visual seat status indicators (`AVAILABLE`, `OCCUPIED`, `RESERVED`, `EXPIRING_SOON`, `MAINTENANCE`), responsive UI layout, and dark/light theme integration. |
| **6831503002** | **Aung Kyaw Min Htet** | **DevOps & Cloud Infrastructure:** Multi-stage Docker containerization, Docker Compose configuration (`ors-infra`), AWS EC2 automated setup & deploy scripts, Nginx reverse proxy configuration with SSL/TLS, and GitHub Actions CI/CD workflows.                                         |
| **6831503003** | **Aung Myo Myint**     | **Backend Security & User Authentication:** Spring Boot 3 security architecture, stateless JWT authentication (`/api/auth/**`), Role-Based Access Control (RBAC for `ADMINISTRATOR` and `STUDENT`), password hashing, and user profile management.                                        |
| **6831503022** | **Kaung Sett Paing**   | **Reservation & Session Management Engine:** Anti-hoarding workstation booking rules (1–4 hour slots, 1 hour max advance), physical arrival grace period verification (20 min window), check-in / check-out lifecycle, and background auto-expiry scheduled tasks.                        |
| **6831503119** | **Bhone Pyae Ko**      | **Admin Analytics & QR Code Subsystem:** Administrator dashboard metrics, time-series utilization charts & KPIs, ZXing QR code generation for 54 physical desk labels, and camera-based HTML5 QR code check-in scanner integration.                                                       |

---

## 🏗️ Project Architecture

```text
Sec_Project/
├── ors-infra/        # Database infrastructure (MySQL 8 Docker setup & initial SQL schema)
├── ors-server/       # Spring Boot 3.4 / Java 21 REST API backend (th.mfu)
├── ors-frontend/     # Next.js 16 (App Router) + React 19 + Tailwind CSS frontend
├── deploy/           # AWS EC2 deployment scripts, Nginx configuration, and domain setup
├── doc/              # Architecture design, database ERD, and threat modeling documentation
└── api-doc/          # REST API specifications and endpoint contracts
```

### Port Allocations

| Service                 | Port                     | Description                                   |
| :---------------------- | :----------------------- | :-------------------------------------------- |
| **MySQL Database**      | `3307` (container: 3306) | MySQL 8.4 database running via Docker         |
| **Spring Boot Backend** | `8080`                   | REST API service (`/api/v1/*`, `/api/auth/*`) |
| **Next.js Frontend**    | `3000`                   | Web application & Admin dashboard             |

---

## 🚀 How to Run the Project (Step-by-Step)

### Prerequisites

- **Java JDK 21** or later
- **Node.js 20 LTS** or **22 LTS** and `npm`
- **Docker & Docker Compose**
- **Maven** (or use the included `./mvnw` wrapper in `ors-server`)

---

### Step 1: Start the MySQL Database (`ors-infra`)

Open **Terminal 1**:

```bash
cd ors-infra
chmod +x startInfra.sh
./startInfra.sh
```

_(On Windows, run `startInfra.bat`)_

> Verify MySQL is running:
>
> ```bash
> docker ps -f name=ors-db
> ```
>
> Expected status: `Up ... (healthy)` on port `3307`.

---

### Step 2: Start the Spring Boot Backend (`ors-server`)

Open **Terminal 2**:

```bash
cd ors-server
mvn spring-boot:run
```

_(Alternatively, use `./mvnw spring-boot:run`)_

> Wait until the log displays:
>
> ```text
> Tomcat started on port 8080 (http)
> Started App in X.XXX seconds
> >>> ORS Database ready with 54 workstations and default admin: admin@gmail.com
> ```
>
> Test the health endpoint:
>
> ```bash
> curl http://localhost:8080/api/v1/health
> ```

---

### Step 3: Start the Next.js Frontend (`ors-frontend`)

Open **Terminal 3**:

```bash
cd ors-frontend
npm install
npm run dev
```

> Open your browser at:
> 👉 **`http://localhost:3000`**

---

## 🔑 Test Accounts & Demo Credentials

| Role              | Username / Email                  | Password          | Access / Permissions                                                                     |
| :---------------- | :-------------------------------- | :---------------- | :--------------------------------------------------------------------------------------- |
| **Administrator** | `admin` _(or `admin@gmail.com`)_  | `admin123`        | Full access to `/admin` dashboard, workstation overrides, session termination, telemetry |
| **Student**       | `alex.chen@lamduan.mfu.ac.th`     | `StudentPass123!` | Standard workstation reservation, QR check-in, profile viewing                           |
| **Student**       | `sarah.kim@lamduan.mfu.ac.th`     | `StudentPass123!` | Standard workstation reservation, QR check-in, profile viewing                           |
| **Student**       | `marcus.taylor@lamduan.mfu.ac.th` | `StudentPass123!` | Standard workstation reservation, QR check-in, profile viewing                           |
| **Student**       | `emily.zhao@lamduan.mfu.ac.th`    | `StudentPass123!` | Standard workstation reservation, QR check-in, profile viewing                           |

---

## 🧪 Running Automated Tests

### Backend Unit & Integration Tests (Spring Boot + JUnit 5 + MockMvc + H2)

```bash
cd ors-server
mvn test
```

### Frontend Build & Typecheck

```bash
cd ors-frontend
npm run build
```

---

## 🔒 Security Compliance

- **No hardcoded secrets:** All production credentials, JWT secret keys, and database passwords are parameterized through environment variables (`.env`).
- Passwords are encrypted using **BCrypt** hashing.
- API endpoints are protected using **JJWT** Bearer token authentication.
