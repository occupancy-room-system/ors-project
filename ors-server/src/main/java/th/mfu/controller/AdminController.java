package th.mfu.controller;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import th.mfu.dto.request.SeatStatusRequest;
import th.mfu.dto.request.TerminateSessionRequest;
import th.mfu.dto.response.AnalyticsResponse;
import th.mfu.dto.response.ApiResponse;
import th.mfu.dto.response.QrCodeItemResponse;
import th.mfu.dto.response.UsageDashboardResponse;
import th.mfu.entity.Seat;
import th.mfu.service.AdminService;
import th.mfu.util.LabOperatingHours;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    @GetMapping("/analytics")
    public ResponseEntity<ApiResponse<AnalyticsResponse>> getAnalytics() {
        AnalyticsResponse response = adminService.getAnalytics();
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/usage-metrics")
    public ResponseEntity<ApiResponse<UsageDashboardResponse>> getUsageMetrics(
            @RequestParam(required = false, defaultValue = "daily") String interval,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        UsageDashboardResponse response = adminService.getUsageMetrics(interval, startDate, endDate);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/qr-codes")
    public ResponseEntity<ApiResponse<List<QrCodeItemResponse>>> getAllQrCodes(HttpServletRequest request) {
        String proto = request.getHeader("X-Forwarded-Proto") != null ? request.getHeader("X-Forwarded-Proto") : request.getScheme();
        String host = request.getHeader("Host") != null ? request.getHeader("Host") : "localhost:3000";
        String baseUrl = proto + "://" + host;

        List<QrCodeItemResponse> list = adminService.getAllQrCodes(baseUrl);
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @PatchMapping("/seats/{seatId}/status")
    public ResponseEntity<ApiResponse<Seat>> toggleSeatStatus(
            @PathVariable Long seatId,
            @RequestBody SeatStatusRequest request) {
        Seat updated = adminService.toggleSeatStatus(seatId, request.getStatus());
        return ResponseEntity.ok(ApiResponse.success("Seat " + updated.getSeatCode() + " marked as " + updated.getStatus(), updated));
    }

    @PostMapping("/sessions/{sessionId}/terminate")
    public ResponseEntity<ApiResponse<Map<String, Object>>> terminateSession(
            @PathVariable Long sessionId,
            @RequestBody(required = false) TerminateSessionRequest request) {
        String reason = request != null ? request.getReason() : "Administrative termination";
        adminService.terminateSession(sessionId, reason);
        return ResponseEntity.ok(ApiResponse.success("Session force-terminated.", Map.of("sessionId", sessionId, "status", "FORCE_TERMINATED")));
    }

    // Seat CRUD
    @PostMapping("/seats")
    public ResponseEntity<ApiResponse<Seat>> createSeat(@RequestBody th.mfu.dto.request.SeatUpsertRequest request) {
        Seat created = adminService.createSeat(request);
        return ResponseEntity.ok(ApiResponse.success("Workstation created successfully", created));
    }

    @PutMapping("/seats/{seatId}")
    public ResponseEntity<ApiResponse<Seat>> updateSeat(
            @PathVariable Long seatId,
            @RequestBody th.mfu.dto.request.SeatUpsertRequest request) {
        Seat updated = adminService.updateSeat(seatId, request);
        return ResponseEntity.ok(ApiResponse.success("Workstation updated successfully", updated));
    }

    @DeleteMapping("/seats/{seatId}")
    public ResponseEntity<ApiResponse<Void>> deleteSeat(@PathVariable Long seatId) {
        adminService.deleteSeat(seatId);
        return ResponseEntity.ok(ApiResponse.success("Workstation deleted successfully", null));
    }

    // Sessions History & Monitoring
    @GetMapping("/sessions")
    public ResponseEntity<ApiResponse<List<th.mfu.entity.OccupancySession>>> getAllSessions(
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) String status) {
        List<th.mfu.entity.OccupancySession> sessions = adminService.getAllSessions(userId, status);
        return ResponseEntity.ok(ApiResponse.success(sessions));
    }

    @DeleteMapping("/sessions/{sessionId}")
    public ResponseEntity<ApiResponse<Void>> deleteSessionRecord(@PathVariable Long sessionId) {
        adminService.deleteSessionRecord(sessionId);
        return ResponseEntity.ok(ApiResponse.success("Session log record deleted successfully", null));
    }

    @GetMapping("/operating-hours")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getOperatingHours() {
        return ResponseEntity.ok(ApiResponse.success(Map.of(
                "openHour", LabOperatingHours.getOpensAt().getHour(),
                "closeHour", LabOperatingHours.getClosesAt().getHour(),
                "workstationsEnabled", LabOperatingHours.isWorkstationsEnabled(),
                "opensAt", LabOperatingHours.formatTime(LabOperatingHours.getOpensAt()),
                "closesAt", LabOperatingHours.formatTime(LabOperatingHours.getClosesAt())
        )));
    }

    @PutMapping("/operating-hours")
    public ResponseEntity<ApiResponse<Map<String, Object>>> updateOperatingHours(
            @RequestBody Map<String, Object> body) {
        if (body.containsKey("openHour") && body.get("openHour") instanceof Number) {
            LabOperatingHours.setOpenHour(((Number) body.get("openHour")).intValue());
        }
        if (body.containsKey("closeHour") && body.get("closeHour") instanceof Number) {
            LabOperatingHours.setCloseHour(((Number) body.get("closeHour")).intValue());
        }
        if (body.containsKey("workstationsEnabled")) {
            LabOperatingHours.setWorkstationsEnabled(Boolean.TRUE.equals(body.get("workstationsEnabled")));
        }
        return getOperatingHours();
    }
}

