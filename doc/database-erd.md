# Database Entity-Relationship Diagram (ERD) & Data Dictionary

## 1. Mermaid Entity-Relationship Diagram

```mermaid
erDiagram
    USERS ||--o{ OCCUPANCY_SESSIONS : "starts"
    USERS ||--o{ NOTIFICATIONS : "receives"
    USERS ||--o{ AUDIT_LOGS : "acts_in"
    ROOMS ||--|{ SEATS : "contains"
    SEATS ||--o{ OCCUPANCY_SESSIONS : "booked_in"
    OCCUPANCY_SESSIONS ||--|{ OCCUPANCY_EVENTS : "generates"

    USERS {
        bigint id PK
        string full_name "Student or Admin Name"
        string email UK "University Email"
        string password_hash "BCrypt Hash"
        string role "STUDENT | ADMINISTRATOR"
        string account_status "ACTIVE | SUSPENDED"
        timestamp created_at
        timestamp updated_at
    }

    ROOMS {
        bigint id PK
        string room_code UK "e.g. SE-LAB-101"
        string name "Software Engineering Lab"
        string description
        string building "Turing Hall"
        int floor_level
        int width_units "Grid width"
        int height_units "Grid height"
        string status "ACTIVE | MAINTENANCE"
        timestamp created_at
        timestamp updated_at
    }

    SEATS {
        bigint id PK
        bigint room_id FK
        string seat_code "e.g. SEAT-A1"
        int x_position "Grid X coordinate"
        int y_position "Grid Y coordinate"
        string pod_label "Pod A (Scrum Alpha)"
        string status "AVAILABLE | OCCUPIED | EXPIRING_SOON | MAINTENANCE"
        string qr_token UK "QR-SELAB101-A1"
        timestamp created_at
        timestamp updated_at
    }

    OCCUPANCY_SESSIONS {
        bigint id PK
        bigint user_id FK
        bigint seat_id FK
        timestamp checked_in_at
        timestamp expires_at "Server-Authoritative (<= 120m)"
        timestamp checked_out_at
        string status "ACTIVE | CHECKED_OUT | EXPIRED | FORCE_TERMINATED"
        timestamp created_at
        timestamp updated_at
    }

    OCCUPANCY_EVENTS {
        bigint id PK
        bigint session_id FK
        bigint user_id
        bigint seat_id
        string event_type "CHECK_IN | CHECK_OUT | EXPIRED | REMINDER"
        timestamp event_time
        json metadata
    }

    NOTIFICATIONS {
        bigint id PK
        bigint user_id FK
        string notification_type "EXPIRY_WARNING | ALERT"
        string title
        text message
        timestamp created_at
        timestamp read_at
    }

    AUDIT_LOGS {
        bigint id PK
        bigint actor_user_id FK
        string action "TERMINATE_SESSION | DEACTIVATE_SEAT"
        string entity_type
        string entity_id
        json details
        string ip_address
        timestamp created_at
    }
```

## 2. Table Schemas & Constraints

### `users`
- Stores user credentials, role-based access flag (`STUDENT`, `ADMINISTRATOR`), and account state.
- Passwords are encrypted strictly using Spring Security's `BCryptPasswordEncoder`.

### `rooms`
- Represents a physical lab space. Holds dimensions (`width_units`, `height_units`) used by the frontend 2D layout canvas.

### `seats`
- Represents an individual desk or workstation within a room.
- Holds `x_position` and `y_position` integer coordinates.
- Unique constraint: `(room_id, seat_code)` prevents naming collisions.
- Unique `qr_token` safely mapped to physical printed QR sticker without leaking user data.

### `occupancy_sessions`
- Authoritative record of who checked in to which seat and when.
- `expires_at` is always computed and enforced on the server (max 120 minutes from `checked_in_at`).
- Concurrency rule: At most one session per student with status `ACTIVE`, and at most one active session per seat.

### `occupancy_events`
- Append-only event log capturing every transition for audit compliance and Recharts analytics.

### `notifications`
- In-app notification queue, especially for the 10-minute warning prior to session expiration.

### `audit_logs`
- Administrative accountability log recording admin terminations, room modifications, and role updates.
