package th.mfu.controller;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import th.mfu.dto.request.ReservationCreateRequest;
import th.mfu.dto.response.ApiResponse;
import th.mfu.entity.Reservation;
import th.mfu.service.ReservationService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/reservations")
public class ReservationController {

    private final ReservationService reservationService;

    public ReservationController(ReservationService reservationService) {
        this.reservationService = reservationService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Reservation>> createReservation(@Valid @RequestBody ReservationCreateRequest req) {
        Reservation reservation = reservationService.createReservation(req);
        String msg = Boolean.TRUE.equals(reservation.getIsGroupReservation())
                ? reservation.getGroupTableName() + " (" + reservation.getTotalSeatsReserved() + " desks) reserved! Head to the lab and scan the table QR code to activate."
                : "Workstation " + reservation.getSeatCode() + " reserved! Scan the physical QR code on the desk to activate.";
        return ResponseEntity.ok(ApiResponse.success(msg, reservation));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<List<Reservation>>> getUserReservations(@RequestParam(required = false) Long userId) {
        List<Reservation> list = reservationService.getUserReservations(userId);
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @PostMapping("/{reservationId}/cancel")
    public ResponseEntity<ApiResponse<Map<String, Object>>> cancelReservation(
            @PathVariable Long reservationId,
            @RequestBody(required = false) Map<String, Object> body) {
        Long userId = null;
        if (body != null && body.get("userId") != null) {
            userId = Long.valueOf(body.get("userId").toString());
        }
        reservationService.cancelReservation(reservationId, userId);
        return ResponseEntity.ok(ApiResponse.success("Reservation cancelled. Workstation(s) are now available.",
                Map.of("reservationId", reservationId, "status", "CANCELLED")));
    }
}

