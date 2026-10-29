package th.mfu.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import th.mfu.dto.request.QrActivateRequest;
import th.mfu.dto.response.ApiResponse;
import th.mfu.dto.response.OccupancySessionResponse;
import th.mfu.service.SessionService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/sessions")
public class SessionController {

    private final SessionService sessionService;

    public SessionController(SessionService sessionService) {
        this.sessionService = sessionService;
    }

    @PostMapping("/activate-qr")
    public ResponseEntity<ApiResponse<OccupancySessionResponse>> activateQr(@RequestBody QrActivateRequest req) {
        OccupancySessionResponse resp = sessionService.activateQr(req);
        return ResponseEntity.ok(ApiResponse.success("Session activated successfully!", resp));
    }

    @PostMapping("/check-in")
    public ResponseEntity<ApiResponse<OccupancySessionResponse>> checkIn(@RequestBody QrActivateRequest req) {
        OccupancySessionResponse resp = sessionService.checkIn(req);
        return ResponseEntity.ok(ApiResponse.success("Checked in successfully!", resp));
    }

    @PostMapping("/{sessionId}/check-out")
    public ResponseEntity<ApiResponse<Map<String, Object>>> checkOut(
            @PathVariable Long sessionId,
            @RequestBody(required = false) Map<String, Object> body) {
        Long userId = null;
        if (body != null && body.get("userId") != null) {
            userId = Long.valueOf(body.get("userId").toString());
        }
        sessionService.checkOut(sessionId, userId);
        return ResponseEntity.ok(ApiResponse.success("Checked out successfully. Workstation(s) released.",
                Map.of("sessionId", sessionId, "status", "CHECKED_OUT")));
    }

    @GetMapping("/me/active")
    public ResponseEntity<ApiResponse<OccupancySessionResponse>> getActiveSession(@RequestParam(required = false) Long userId) {
        OccupancySessionResponse resp = sessionService.getActiveSession(userId);
        return ResponseEntity.ok(ApiResponse.success(resp));
    }

    @GetMapping("/me/history")
    public ResponseEntity<ApiResponse<List<OccupancySessionResponse>>> getSessionHistory(@RequestParam(required = false) Long userId) {
        List<OccupancySessionResponse> list = sessionService.getSessionHistory(userId);
        return ResponseEntity.ok(ApiResponse.success(list));
    }
}

