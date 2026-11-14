# System Architecture Documentation

## 1. High-Level Architecture Overview

The Occupancy Room System (ORS) follows a modular, decoupled, 3-tier architecture capable of running locally via Docker Compose or in production on cloud infrastructure (AWS EC2):

```text
  [ Web Browsers & Mobile Clients ]
                │
                ▼ HTTPS (Port 443) / HTTP (Port 80)
  ┌──────────────────────────────────────────────────────────────┐
  │ Reverse Proxy & Web Gateway (Nginx + SSL / Let's Encrypt)     │
  │   - TLS/SSL Termination & Automated Certificate Renewal      │
  │   - location /api/  ──► http://127.0.0.1:8080 (REST API)     │
  │   - location /      ──► http://127.0.0.1:3000 (Web Frontend) │
  └──────────────────────────────┬───────────────────────────────┘
                                 │
         ┌───────────────────────┴───────────────────────┐
         ▼                                               ▼
┌──────────────────────────────┐        ┌──────────────────────────────┐
│ Frontend Container           │        │ Backend API Container        │
│ (Next.js 16 / React 19)      │        │ (Spring Boot 3.4 / Java 21)  │
│  - 2D Canvas Floor Plan      │        │  - Spring Security + JJWT    │
│  - HTML5 Camera QR Scanner   │        │  - Reservation State Machine │
│  - Session Timer HUD         │        │  - Session Lifecycle Engine  │
│  - Recharts Admin Dashboard  │        │  - Background Auto-Expiry    │
│  - Internal Proxy Rewrite    │        │  - ZXing QR Generator        │
└──────────────────────────────┘        └──────────────┬───────────────┘
                                                       │ JDBC (Port 3306)
                                                       ▼
                                        ┌──────────────────────────────┐
                                        │ Database Container           │
                                        │ (MySQL 8.4 Enterprise-Grade) │
                                        │  - Persistent Volume         │
                                        │  - Schema & Baseline Seeds   │
                                        │  - UTC Timestamps            │
                                        └──────────────────────────────┘
```

---

## 2. Core Architectural Principles

### 1. Server-Authoritative Session Lifecycle
- The browser client **never** dictates session duration or termination.
- Expiration timestamps (`expires_at`) are calculated and validated strictly by the Spring Boot backend upon check-in.
- A Spring `@Scheduled` background worker scans active records every 60 seconds and auto-transitions elapsed sessions to `EXPIRED`, immediately restoring workstation availability.

### 2. Concurrency & Double-Booking Protection
- Workstation bookings and QR check-ins execute within isolated database transactions.
- Pessimistic write locking (`SELECT ... FOR UPDATE`) prevents race conditions where two students simultaneously attempt to book or scan into the same workstation.
- Unique database constraints guarantee that a student cannot hold more than one active working session concurrently.

### 3. Anti-Hoarding Reservation Rules
- **Short-Advance Window:** Reservations can only be scheduled up to 1 hour in advance (preventing users from locking down desks days ahead).
- **Physical Arrival Grace Period:** Students have a strict 20-minute window from `startTime` to physically scan the desk QR code. If unattended after 20 minutes, the reservation is automatically cancelled and released to the public pool.
- **Atomic Group Table Reservations:** Collaboration tables (for 2, 6, or 9 students) are reserved atomically as a single team unit.

### 4. Privacy by Design
- The public 2D floor plan indicates desk availability (`AVAILABLE`, `OCCUPIED`, `RESERVED`, `EXPIRING_SOON`, `MAINTENANCE`) without exposing student names, student IDs, or personal telemetry to unauthenticated visitors.
- Physical QR codes encode opaque, cryptographically secure tokens (`QR-SELAB101-A1`), preventing unauthorized user identification.

### 5. Multi-Environment Port Contract
| Service | Local Dev Port | Production Docker Port | Purpose |
| :--- | :--- | :--- | :--- |
| **MySQL Database** | `3307` | `3306` (Internal Docker) | Prevents host port collisions with local MySQL installations |
| **Spring Boot Backend** | `8080` | `8080` (Internal Docker) | Exposes REST APIs, Actuator, and Health Probes |
| **Next.js Frontend** | `3000` | `3000` (Internal Docker) | SSR Web pages and interactive UI |
| **Nginx Reverse Proxy** | — | `80` (HTTP) & `443` (HTTPS) | Public internet gateway with SSL certificate |
