# REST API Specifications (`/api/v1`)

All API responses follow the standard `ApiResponse<T>` envelope:
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... },
  "timestamp": "2026-10-16T08:00:00Z"
}
```

Errors return `ErrorResponse`:
```json
{
  "success": false,
  "errorCode": "SEAT_ALREADY_OCCUPIED",
  "message": "Seat SEAT-A3 is currently occupied by another student session.",
  "details": ["Current session expires in 45 minutes."],
  "timestamp": "2026-10-16T08:00:00Z"
}
```

---

## 1. Public & Laboratory Occupancy Endpoints

### `GET /api/v1/health`
Checks backend readiness, MySQL connectivity on port 3307, and system status.

### `GET /api/v1/rooms`
Returns a list of all active rooms with seat counts and dimensions.

### `GET /api/v1/rooms/{roomId}/map`
Returns complete 2D layout coordinates for room and seats.
- **Parameters**: `roomId` (Long)
- **Response**:
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

---

## 2. Authentication Endpoints

### `POST /api/v1/auth/login`
- **Request**:
```json
{
  "email": "alex.chen@student.university.edu",
  "password": "StudentPass123!"
}
```
- **Response**: User profile and session token.

### `POST /api/v1/auth/register`
- **Request**:
```json
{
  "fullName": "Jane Doe",
  "email": "jane.doe@student.university.edu",
  "password": "StudentPass123!"
}
```

### `GET /api/v1/auth/me`
Returns currently authenticated user profile and roles.

---

## 3. Session Management Endpoints

### `POST /api/v1/sessions/check-in`
Claims a seat and starts an authoritative session (up to 120 minutes).
- **Request**:
```json
{
  "qrToken": "QR-SELAB101-A1",
  "durationMinutes": 120
}
```
- **Validation**:
  - Checks if user already has an active session.
  - Checks if seat is currently available.
  - Ensures duration does not exceed policy maximum (120 minutes).

### `POST /api/v1/sessions/{sessionId}/check-out`
Ends an active session, frees the seat immediately, and records `CHECK_OUT` occupancy event.

### `GET /api/v1/sessions/me/active`
Retrieves current student's active session, seat information, and remaining time.

### `GET /api/v1/sessions/me/history`
Retrieves past completed sessions for the authenticated student.

---

## 4. Administrative Endpoints (`ROLE_ADMINISTRATOR`)

### `GET /api/v1/admin/analytics`
Occupancy trends, peak hourly usage, pod utilization, and session duration averages.

### `GET /api/v1/admin/qr-codes`
Lists all seat QR tokens, printable labels, and SVGs.

### `POST /api/v1/admin/sessions/{sessionId}/terminate`
Force-terminates a session (with audit trail reason).
