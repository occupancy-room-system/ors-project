# System Architecture Documentation

## 1. High-Level Architecture Overview

```
 [ Browser Client: Student & Admin ]
               |
               v (HTTPS / JSON REST API)
 [ Frontend Web Application (Next.js / React) ]
   - Top Bar Navigation Contract
   - 2D SVG/Canvas Interactive Lab Map
   - HTML5 Camera QR Scanner
   - Tabular Countdown Session HUD
   - Recharts Analytics Dashboard
               |
               v (Port 8080 or Dev Proxy Port 3000)
 [ Spring Boot Backend Application ]
   - Feature Packages (auth, room, seat, session, analytics, audit)
   - Spring Security (Stateless JWT / HttpOnly Cookie & Role Guards)
   - Spring Data JPA + Hibernate Validator
   - Scheduled Background Task (Session Expiry & 10m Warning)
   - Actuator Health Checks (/actuator/health)
               |
               v (JDBC on Host Port 3307 -> Container 3306)
 [ MySQL 8.x Docker Container ]
   - Flyway Schema Migrations (V1 DDL, V2 Seed)
   - Persistent Docker Volume (mysql-occupancy-data)
   - UTC Timestamp Standards
```

## 2. Core Architectural Principles

1. **Server-Authoritative Session Lifecycle**:
   - The browser never dictates session expiration. Expiry timestamps are calculated and sealed by the server upon check-in.
   - Background Spring `@Scheduled` worker periodically scans for expired sessions and moves them to `EXPIRED` status, freeing the seat.

2. **Concurrency & Double-Booking Prevention**:
   - Database transactions with pessimistic write locking (`SELECT ... FOR UPDATE`) or optimistic version checks ensure two students scanning the same seat simultaneously cannot both receive check-in confirmation.
   - Unique constraints prevent multiple active sessions for the same seat or user.

3. **Privacy by Design**:
   - The public 2D map indicates seat occupancy status (`AVAILABLE`, `OCCUPIED`, `EXPIRING_SOON`) but NEVER reveals student identity, student IDs, or names to anonymous visitors.
   - QR codes contain only opaque tokens (`QR-SELAB101-A1`) or URLs (`/check-in?token=...`), never containing student PII or credentials.

4. **Port Configuration Contract**:
   - MySQL Host Port: `3307` (mapped to container port `3306`). This avoids collisions with standard local MySQL instances.
   - Spring Boot Host Port: `8080`.
   - Frontend Dev Port: `3000`.

5. **Physical Presence vs. Registered Check-In Limitation**:
   - Notice: The system records registered electronic check-ins initiated via seat QR codes. It does not interface with physical load cells, overhead optical cameras, or turnstiles.
