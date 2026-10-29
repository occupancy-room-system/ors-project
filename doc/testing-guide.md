# Testing Guide & Test Plans

## 1. Backend Testing Strategy

### A. Business Rule Unit Tests
- `SessionRuleTest`: Verifies a student cannot exceed 120 minutes maximum duration.
- `ConcurrencyTest`: Verifies simultaneous check-in attempts for the same seat results in exactly 1 success and 1 `SEAT_ALREADY_OCCUPIED` rejection.
- `SingleActiveSessionRuleTest`: Verifies a student cannot occupy multiple seats concurrently.

### B. Integration Tests
- `RoomControllerIntegrationTest`: Tests `/api/v1/rooms/{id}/map` returns correct layout coordinates and status counters.
- `HealthControllerTest`: Verifies database connection query on port 3307.

To run backend tests:
```bash
cd backend
./mvnw test
```

## 2. Frontend Testing Strategy

- **2D Map Rendering Test**: Verifies all 24 seats render in their designated coordinates and reflect backend status colors.
- **Session Countdown Timer**: Verifies visual countdown matches server-provided `expiresAt`.
- **Warning Threshold Test**: Verifies 10-minute warning state turns seat amber and shows in-app reminder alert.
- **Form Validation**: Tests email format and required password fields.
