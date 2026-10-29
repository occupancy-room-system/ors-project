# Occupancy Room System (University Software Engineering Lab)

A modern full-stack web application that allows students to check real-time laboratory seat occupancy before travelling to the lab, scan seat QR codes upon arrival, manage 2-hour occupancy sessions, and enables administrators to monitor lab utilization, generate QR code signage, and analyze usage trends.

---

## 1. Problem Statement & Objectives

Students frequently commute to the University Software Engineering Laboratory only to find that all workstations are occupied. Conversely, abandoned seats without active students create perceived shortages.

**Key Objectives:**
- **Pre-trip Visibility**: Provide an interactive visual 2D floor plan showing available, occupied, and expiring seats.
- **Fair Seat Turnover**: Enforce a strict 120-minute maximum session with 10-minute expiry notifications.
- **Low-friction QR Check-in**: Students scan a unique QR code on the physical desk to claim the seat.
- **Administrative Control**: Real-time KPI dashboard, Recharts analytics, seat status toggles, and printable QR label generation.

> **Important Limitation**: This system tracks registered digital check-ins and checkouts initiated by users. It does not independently verify physical presence using optical sensors or turnstiles.

---

## 2. Technology Stack

- **Frontend**: Next.js App Router / React 19, TypeScript, Tailwind CSS, Lucide Icons, Recharts, Browser Camera QR Scanner.
- **Backend**: Java 17+, Spring Boot 3.3.x, Spring Data JPA, Spring Security (BCrypt), Bean Validation, Spring Boot Actuator.
- **Database & Migrations**: MySQL 8.x in Docker, Flyway Migrations (V1 DDL, V2 Seed), UTC timestamps.
- **Infrastructure**: Docker Compose, Host Port 3307, persistent named volume.

---

## 3. Quick Start (Phase 1)

1. **Start Database**:
   ```bash
   cd docker-infra
   ./scripts/start-db.sh
   ```
2. **Start Backend**:
   ```bash
   cd ../backend
   ./mvnw spring-boot:run
   ```
3. **Start Web Frontend**:
   ```bash
   npm install
   npm run dev
   ```
   Open `http://localhost:3000`
