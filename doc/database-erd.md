# Database Entity-Relationship Diagram (ERD) & Data Dictionary

## 1. Mermaid Entity-Relationship Diagram

```mermaid
erDiagram
    USERS ||--o{ RESERVATIONS : "creates"
    USERS ||--o{ OCCUPANCY_SESSIONS : "starts"
    USERS ||--o{ AUDIT_LOGS : "triggers"
    ROOMS ||--|{ SEATS : "contains"
    SEATS ||--o{ RESERVATIONS : "reserved_in"
    SEATS ||--o{ OCCUPANCY_SESSIONS : "occupied_by"
    OCCUPANCY_SESSIONS ||--|{ OCCUPANCY_EVENTS : "generates"

    USERS {
        bigint id PK
        string full_name "Student or Admin Name"
        string username UK "Student ID or Username"
        string email UK "University Email"
        string password_hash "BCrypt Encrypted"
        string role "STUDENT | ADMINISTRATOR"
        string account_status "ACTIVE | SUSPENDED"
        timestamp created_at
        timestamp updated_at
    }

    ROOMS {
        bigint id PK
        string room_code UK "e.g. SE-LAB-101"
        string name "SE Innovation Lab"
        string description
        string building "Turing Hall"
        int floor_level
        int width_units "Grid Width (30)"
        int height_units "Grid Height (20)"
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
        string pod_label "Station A (A1-A6) or Group Table 1"
        string status "AVAILABLE | OCCUPIED | RESERVED | EXPIRING_SOON | MAINTENANCE"
        string qr_token UK "QR-SELAB101-A1"
        boolean has_monitor "Monitor available"
        boolean has_power "Power outlets"
        timestamp created_at
        timestamp updated_at
    }

    RESERVATIONS {
        bigint id PK
        bigint user_id FK
        string user_name
        string user_email
        bigint seat_id FK
        string seat_code
        string pod_label
        timestamp start_time "Scheduled Start"
        int duration_hours "1 to 4 hours"
        timestamp expires_at "Arrival Grace Expiry (+20 mins)"
        string status "PENDING_ACTIVATION | ACTIVATED | CANCELLED | EXPIRED"
        boolean is_group_reservation "Atomic Group Booking"
        int group_table_id
        timestamp created_at
    }

    OCCUPANCY_SESSIONS {
        bigint id PK
        bigint user_id FK
        bigint seat_id FK
        timestamp checked_in_at
        timestamp expires_at "Server-Authoritative Timer"
        timestamp checked_out_at
        string status "ACTIVE | CHECKED_OUT | EXPIRED | FORCE_TERMINATED"
        timestamp created_at
    }

    OCCUPANCY_EVENTS {
        bigint id PK
        bigint session_id FK
        bigint seat_id FK
        string event_type "CHECK_IN | CHECK_OUT | AUTO_EXPIRE | ADMIN_TERMINATE"
        timestamp event_timestamp
    }

    AUDIT_LOGS {
        bigint id PK
        bigint user_id FK
        string action "MAINTENANCE_TOGGLE | SESSION_FORCE_CLOSE | USER_STATUS_CHANGE"
        string target_entity "SEAT | SESSION | USER"
        bigint target_id
        string reason
        timestamp created_at
    }
```

---

## 2. Table Data Dictionary

### `users`
| Column | Type | Constraints | Description |
|:---|:---|:---|:---|
| `id` | `BIGINT` | PK, AUTO_INCREMENT | Unique user identifier |
| `username` | `VARCHAR(50)` | UNIQUE, NOT NULL | Student ID or login username |
| `full_name` | `VARCHAR(100)` | NOT NULL | Display name |
| `email` | `VARCHAR(150)` | UNIQUE, NOT NULL | Lamduan university email address |
| `password_hash`| `VARCHAR(255)` | NOT NULL | BCrypt password hash |
| `role` | `VARCHAR(20)` | NOT NULL | `STUDENT` or `ADMINISTRATOR` |
| `account_status`| `VARCHAR(20)`| NOT NULL | `ACTIVE` or `SUSPENDED` |
| `created_at` | `TIMESTAMP` | NOT NULL | Account creation timestamp |

### `rooms`
| Column | Type | Constraints | Description |
|:---|:---|:---|:---|
| `id` | `BIGINT` | PK, AUTO_INCREMENT | Room identifier |
| `room_code` | `VARCHAR(30)` | UNIQUE, NOT NULL | Short code (`SE-LAB-101`) |
| `name` | `VARCHAR(100)`| NOT NULL | Human-readable name |
| `width_units` | `INT` | NOT NULL | 2D canvas grid width |
| `height_units`| `INT` | NOT NULL | 2D canvas grid height |
| `status` | `VARCHAR(20)` | NOT NULL | `ACTIVE` or `MAINTENANCE` |

### `seats`
| Column | Type | Constraints | Description |
|:---|:---|:---|:---|
| `id` | `BIGINT` | PK, AUTO_INCREMENT | Workstation identifier |
| `room_id` | `BIGINT` | FK, NOT NULL | References `rooms(id)` |
| `seat_code` | `VARCHAR(30)` | NOT NULL | e.g. `SEAT-A1` |
| `pod_label` | `VARCHAR(50)` | NOT NULL | Station name (`Station A`, `Group Table 1`) |
| `x_position` | `INT` | NOT NULL | Grid coordinate X |
| `y_position` | `INT` | NOT NULL | Grid coordinate Y |
| `status` | `VARCHAR(30)` | NOT NULL | `AVAILABLE`, `OCCUPIED`, `RESERVED`, `EXPIRING_SOON`, `MAINTENANCE` |
| `qr_token` | `VARCHAR(100)`| UNIQUE, NOT NULL | Unique physical QR code payload |
| `has_monitor` | `BOOLEAN` | DEFAULT TRUE | Monitor equipped |
| `has_power` | `BOOLEAN` | DEFAULT TRUE | Power strip available |

### `reservations`
| Column | Type | Constraints | Description |
|:---|:---|:---|:---|
| `id` | `BIGINT` | PK, AUTO_INCREMENT | Reservation identifier |
| `user_id` | `BIGINT` | FK, NOT NULL | Reserving student |
| `seat_id` | `BIGINT` | FK, NOT NULL | Target workstation |
| `start_time` | `TIMESTAMP` | NOT NULL | Scheduled start time |
| `duration_hours`| `INT` | NOT NULL | 1 to 4 hours |
| `expires_at` | `TIMESTAMP` | NOT NULL | Grace period cut-off (+20m) |
| `status` | `VARCHAR(30)` | NOT NULL | `PENDING_ACTIVATION`, `ACTIVATED`, `CANCELLED`, `EXPIRED` |
| `is_group_reservation`| `BOOLEAN` | DEFAULT FALSE | Atomic group table booking |

### `occupancy_sessions`
| Column | Type | Constraints | Description |
|:---|:---|:---|:---|
| `id` | `BIGINT` | PK, AUTO_INCREMENT | Active work session identifier |
| `user_id` | `BIGINT` | FK, NOT NULL | Active student |
| `seat_id` | `BIGINT` | FK, NOT NULL | Occupied workstation |
| `checked_in_at`| `TIMESTAMP` | NOT NULL | Physical QR scan timestamp |
| `expires_at` | `TIMESTAMP` | NOT NULL | Authoritative session end time |
| `checked_out_at`| `TIMESTAMP`| NULLABLE | Session release timestamp |
| `status` | `VARCHAR(30)` | NOT NULL | `ACTIVE`, `CHECKED_OUT`, `EXPIRED`, `FORCE_TERMINATED` |
