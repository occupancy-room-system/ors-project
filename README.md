# Occupancy Room System (ORS)

A modern, full-stack, enterprise-grade laboratory workstation occupancy and reservation system designed for University Software Engineering Laboratories. Students can check real-time seat occupancy from home or mobile before commuting, make short-advance reservations, scan physical desk QR codes on arrival to activate sessions, and manage their working hours. Laboratory administrators have access to live analytics, peak utilization graphs, usage telemetry over selectable date ranges, seat maintenance overrides, and printable QR sticker sheets.

---

## 1. Project Architecture

The project is structured into three decoupled, production-ready modules:

```
Sec_Project/
├── ors-infra/        # Docker Compose infrastructure (MySQL 8 on port 3307, persistent volume, init scripts)
├── ors-server/       # Spring Boot 3.x / Java 21 REST API backend (th.mfu)
├── ors-frontend/     # Next.js 16 (App Router) + React 19 + Tailwind CSS frontend
├── doc/              # Architecture, database ERD, setup, and testing documentation
└── api-doc/          # REST API specifications and endpoint contracts
```

### Module Responsibilities:

| Module | Tech Stack | Port | Purpose |
|---|---|---|---|
| **`ors-infra`** | Docker, MySQL 8.x | `3307:3306` | Isolated database container (`ors-db`), persistent volume `occupancy_mysql_data`, automated SQL schema & seed script |
| **`ors-server`** | Java 21, Spring Boot, JPA, Security, JJWT, ZXing | `8080` | Authoritative session lifecycle, QR code generator, background auto-expiry scheduler, REST APIs (`/api/v1/*` and `/api/auth/*`) |
| **`ors-frontend`** | Next.js 16, React 19, TypeScript, Tailwind CSS, Lucide, Recharts | `3000` | 2D interactive lab floor plan (54 desks), camera QR code scanner, tabular session HUD, admin metrics dashboard |

---

## 2. Key Features

1. **Architectural 2D Laboratory Floor Plan**:
   - 54 desks mapped into 5 Individual Workstation Stations (A–E, 22 desks) and 5 Group Collaboration Tables (1–5, 32 desks).
   - Real-time seat statuses: `AVAILABLE` (green), `OCCUPIED` (rose), `RESERVED` (indigo), `EXPIRING_SOON` (amber), `MAINTENANCE` (slate).
   - Interactive modal to inspect desk specifications, reservation status, and initiate bookings.

2. **Workstation Reservation with Anti-Hoarding Rules**:
   - Duration options: 1 to 4 hours.
   - Advance limit: Up to 1 hour ahead (prevents seat hoarding days in advance).
   - Arrival grace period: 20 minutes to physically arrive and scan the QR code before the seat is automatically returned to the public pool.
   - Group tables (2, 6, and 9 capacities) reserved atomically as a team.

3. **QR Code Check-In & Camera Scanner**:
   - HTML5 video camera barcode scanner with canvas fallback.
   - Validates physical presence and reservation ownership (prevents students from claiming seats reserved by others).
   - Server-authoritative session timer with 10-minute expiry notifications.

4. **Administrator Dashboard & Telemetry**:
   - Real-time lab KPI summary cards and occupancy rates.
   - Time-series analytics with daily, weekly, and monthly intervals and custom date range filters.
   - Top student utilization rankings.
   - Instant seat maintenance toggles and force-termination controls.
   - High-resolution printable QR sticker generation with SVG/data URIs for all 54 physical lab desks.

---

## 3. Quick Start Guide

### Step 1: Start MySQL Database Container
```bash
cd ors-infra
./startInfra.sh
# (or startInfra.bat on Windows)
```
*MySQL is now reachable at `localhost:3307` with database `orsdb` and credentials `root / ors2026`.*

### Step 2: Start Spring Boot Backend Server
```bash
cd ../ors-server
mvn spring-boot:run
```
*Backend runs on `http://localhost:8080`. Flyway and Spring Data JPA bootstrap 54 workstations, default users, active sessions, and 90 days of sample historical analytics.*

### Step 3: Start Next.js Frontend
```bash
cd ../ors-frontend
npm install
npm run dev
```
*Open `http://localhost:3000` in your browser.*

---

## 4. Default Demonstration Accounts

| Role | Name | Email | Password |
|---|---|---|---|
| **Administrator** | Prof. Robert Vance | `admin@university.edu` | `AdminPass123!` |
| **Student** | Alex Chen | `alex.chen@student.university.edu` | `StudentPass123!` |
| **Student** | Sarah Kim | `sarah.kim@student.university.edu` | `StudentPass123!` |
| **Student** | Marcus Taylor | `marcus.taylor@student.university.edu` | `StudentPass123!` |
| **Student** | Emily Zhao | `emily.zhao@student.university.edu` | `StudentPass123!` |

*(The Web UI also provides one-click account switching in the login modal).*

---

## 5. Running Automated Tests

### Backend Unit & Integration Tests (Spring Boot + MockMvc + H2)
```bash
cd ors-server
mvn test
```

### Frontend Build & Typecheck
```bash
cd ors-frontend
npm run build
```

