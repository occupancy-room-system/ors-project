package th.mfu.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import th.mfu.dto.response.ApiResponse;
import th.mfu.dto.response.HealthResponse;
import th.mfu.repository.OccupancySessionRepository;
import th.mfu.repository.SeatRepository;

import javax.sql.DataSource;
import java.sql.Connection;

@RestController
@RequestMapping("/api/v1/health")
public class HealthController {

    private final DataSource dataSource;
    private final OccupancySessionRepository sessionRepository;
    private final SeatRepository seatRepository;

    public HealthController(DataSource dataSource, OccupancySessionRepository sessionRepository, SeatRepository seatRepository) {
        this.dataSource = dataSource;
        this.sessionRepository = sessionRepository;
        this.seatRepository = seatRepository;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<HealthResponse>> getHealth() {
        boolean dbConnected = false;
        try (Connection conn = dataSource.getConnection()) {
            dbConnected = conn.isValid(2);
        } catch (Exception ignored) {
        }

        long activeSessions = sessionRepository.findByStatus("ACTIVE").size();
        long totalSeats = seatRepository.count();

        HealthResponse health = new HealthResponse(
                "ORS Server",
                "OK",
                dbConnected,
                activeSessions,
                totalSeats
        );

        return ResponseEntity.ok(ApiResponse.success(health));
    }
}

