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
}

