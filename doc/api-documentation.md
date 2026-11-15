# REST API Specifications (`/api/v1` & `/api/auth`)

The Occupancy Room System (ORS) exposes RESTful API endpoints for student reservations, QR code session activations, room floor plans, and administrative analytics.

---

## 1. Standard Response & Error Envelope

All API responses follow the standardized `ApiResponse<T>` envelope:

```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... },
  "timestamp": "2026-11-15T08:00:00Z"
}
```

Error responses follow the `ErrorResponse` envelope:
```json
{
  "success": false,
  "errorCode": "SEAT_ALREADY_OCCUPIED",
  "message": "Workstation SEAT-A3 is currently occupied by another student session.",
  "details": ["Current session expires in 45 minutes."],
  "timestamp": "2026-11-15T08:00:00Z"
}
```

### Common HTTP Status Codes
| Code | Meaning | Usage |
|:---|:---|:---|
| **200 OK** | Success | Standard response for GET, PUT, and action POSTs |
| **201 Created** | Created | Resource successfully created (reservation, registration) |
| **400 Bad Request** | Validation Error | Missing parameters, illegal booking range, past time |
| **401 Unauthorized** | Unauthenticated | Missing or expired JWT Bearer token |
| **403 Forbidden** | Access Denied | Student attempting administrative action |
| **404 Not Found** | Not Found | Seat, room, or session ID does not exist |
| **409 Conflict** | Business Rule Conflict | Double booking, seat already occupied, grace period expired |

---

## 2. Authentication & Authorization (`/api/auth`)

### `POST /api/auth/login` (also aliased at `/api/v1/auth/login`)
Authenticates student or administrator using credentials and issues a signed JWT token.
- **Access**: Public
- **Request Body**:
```json
{
  "usernameOrEmail": "alex.chen@lamduan.mfu.ac.th",
  "password": "StudentPass123!"
}
```
- **Response `200 OK`**:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiJ9...",
    "type": "Bearer",
    "id": 2,
    "username": "alex.chen",
    "email": "alex.chen@lamduan.mfu.ac.th",
    "fullName": "Alex Chen",
    "role": "STUDENT"
  }
}
```

### `POST /api/auth/register`
Creates a new student account.
- **Access**: Public
- **Request Body**:
```json
{
  "username": "jane.doe",
  "fullName": "Jane Doe",
  "email": "jane.doe@lamduan.mfu.ac.th",
  "password": "StudentPass123!"
}
```
- **Response `201 Created`**

### `GET /api/auth/me`
Fetches the currently authenticated user's profile and active role.
- **Access**: `ROLE_STUDENT`, `ROLE_ADMINISTRATOR` (Bearer Token required)
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": {
    "id": 2,
    "username": "alex.chen",
    "email": "alex.chen@lamduan.mfu.ac.th",
    "fullName": "Alex Chen",
    "role": "STUDENT"
  }
}
```

---

## 3. Public Laboratory & Floor Plan Endpoints (`/api/v1/rooms`)

### `GET /api/v1/health`
Health probe for Docker and cloud load balancers. Returns database target port, connection status, and total workstation count.
- **Access**: Public
- **Response `200 OK`**:
```json
{
  "service": "ors-server",
  "status": "UP",
  "databaseTargetPort": 3307,
  "databaseConnected": true,
  "totalSeats": 54
}
```

### `GET /api/v1/rooms`
Returns a list of all laboratories.
- **Access**: Public
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "roomCode": "SE-LAB-101",
      "name": "SE Innovation Lab",
      "description": "54 High-performance workstations for Software Engineering",
      "totalSeats": 54
    }
  ]
}
```

### `GET /api/v1/rooms/{roomId}/map`
Returns complete 2D layout geometry (x, y coordinates, station pods, seat dimensions, and live status).
- **Access**: Public
- **Response `200 OK`**:
```json
{
  "room": { "id": 1, "roomCode": "SE-LAB-101", "name": "SE Innovation Lab", "widthUnits": 12, "heightUnits": 8 },
  "seats": [
    { "id": 1, "seatCode": "SEAT-A1", "xPosition": 2, "yPosition": 2, "podLabel": "Pod A", "status": "AVAILABLE", "qrToken": "QR-SELAB101-A1" }
  ],
  "totalSeats": 24,
  "availableSeats": 19,
  "occupiedSeats": 5,
  "occupancyPercentage": 20.8
}
```

### `GET /api/v1/rooms/{roomId}/occupancy`
Fast polling summary designed for high-frequency dashboard refresh without transferring coordinate geometry.
- **Access**: Public

### `GET /api/v1/rooms/operating-hours`
Retrieves daily laboratory opening and closing schedules.
- **Access**: Public

---

## 4. Reservation Endpoints (`/api/v1/reservations`)

### `POST /api/v1/reservations`
Creates an advance workstation reservation subject to anti-hoarding business rules.
- **Access**: `ROLE_STUDENT`, `ROLE_ADMINISTRATOR`
- **Request Body**:
```json
{
  "seatId": 1,
  "startTime": "2026-11-15T09:00:00Z",
  "durationMinutes": 120
}
```
- **Business Rules Enforced**:
  - Max advance booking: Up to 1 hour ahead.
  - Duration: Between 60 and 240 minutes.
  - Arrival grace period: 20 minutes from `startTime` before auto-cancellation.
- **Response `200 OK`**:
```json
{
  "success": true,
  "message": "Reservation created successfully",
  "data": {
    "id": 105,
    "seatCode": "SEAT-A1",
    "startTime": "2026-11-15T09:00:00Z",
    "endTime": "2026-11-15T11:00:00Z",
    "status": "CONFIRMED",
    "gracePeriodExpiry": "2026-11-15T09:20:00Z"
  }
}
```

### `GET /api/v1/reservations/me`
Lists the active and upcoming reservations for the logged-in student.
- **Access**: Authenticated user

### `POST /api/v1/reservations/{reservationId}/cancel`
Cancels an upcoming reservation and releases the seat back to the public pool.
- **Access**: Authenticated owner or administrator

---

## 5. Session Management & QR Activation (`/api/v1/sessions`)

### `POST /api/v1/sessions/activate-qr`
Activates an ongoing session by scanning the physical desk QR code upon arrival.
- **Access**: `ROLE_STUDENT`
- **Request Body**:
```json
{
  "qrToken": "QR-SELAB101-A1",
  "durationMinutes": 120
}
```
- **Response `200 OK`**:
```json
{
  "success": true,
  "message": "Session activated",
  "data": {
    "sessionId": 42,
    "seatCode": "SEAT-A1",
    "checkedInAt": "2026-11-15T09:05:00Z",
    "expiresAt": "2026-11-15T11:05:00Z",
    "status": "ACTIVE"
  }
}
```

### `POST /api/v1/sessions/{sessionId}/check-out`
Ends an active session early and frees the workstation immediately.
- **Access**: Authenticated session owner or administrator

### `GET /api/v1/sessions/me/active`
Retrieves the current student's active working session and countdown timer.
- **Access**: Authenticated student

### `GET /api/v1/sessions/me/history`
Retrieves past completed work sessions for the student.
- **Access**: Authenticated student

---

## 6. Administrative Endpoints (`/api/v1/admin`)

All administrative endpoints require **`ROLE_ADMINISTRATOR`**.

### `GET /api/v1/admin/analytics`
Returns aggregate laboratory metrics, average session lengths, and peak utilization trends.

### `GET /api/v1/admin/usage-metrics`
Returns detailed telemetry filtered by selectable timeframes (`daily`, `weekly`, `monthly`, or custom date ranges).

### `GET /api/v1/admin/qr-codes`
Lists all 54 workstation QR tokens, SVG data URIs, and printable sticker specifications.

### `POST /api/v1/admin/seats`
Creates a new laboratory workstation.
- **Request Body**:
```json
{
  "roomId": 1,
  "seatCode": "SEAT-F1",
  "podLabel": "Station F",
  "xPosition": 14,
  "yPosition": 8,
  "hasMonitor": true,
  "hasPower": true
}
```

### `PUT /api/v1/admin/seats/{seatId}`
Updates seat coordinates, specifications, or status (`AVAILABLE`, `MAINTENANCE`).

### `DELETE /api/v1/admin/seats/{seatId}`
Deletes or archives a workstation.

### `GET /api/v1/admin/sessions`
Lists all active and historical sessions across all students in the laboratory.

### `POST /api/v1/admin/sessions/{sessionId}/terminate`
Force-terminates a rogue or unattended session with an administrative audit reason.

### `PUT /api/v1/admin/operating-hours`
Updates laboratory operating hours and reservation blackout windows.

---

## 7. User Management Endpoints (`/api/users`)

Administrative CRUD management for student and staff accounts.
- `GET /api/users` — List all registered users
- `GET /api/users/{id}` — Get single user detail
- `POST /api/users` — Create user account
- `PUT /api/users/{id}` — Update user profile or account status (`ACTIVE`, `SUSPENDED`)
- `DELETE /api/users/{id}` — Remove user account
