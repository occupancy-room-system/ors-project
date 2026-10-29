package th.mfu.scheduler;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import th.mfu.entity.AuditLog;
import th.mfu.entity.OccupancySession;
import th.mfu.entity.Reservation;
import th.mfu.entity.Seat;
import th.mfu.repository.AuditLogRepository;
import th.mfu.repository.OccupancySessionRepository;
import th.mfu.repository.ReservationRepository;
import th.mfu.repository.SeatRepository;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;

@Component
public class SessionExpiryScheduler {

    private final OccupancySessionRepository sessionRepository;
    private final ReservationRepository reservationRepository;
    private final SeatRepository seatRepository;
    private final AuditLogRepository auditLogRepository;

    public SessionExpiryScheduler(OccupancySessionRepository sessionRepository,
                                  ReservationRepository reservationRepository,
                                  SeatRepository seatRepository,
                                  AuditLogRepository auditLogRepository) {
        this.sessionRepository = sessionRepository;
        this.reservationRepository = reservationRepository;
        this.seatRepository = seatRepository;
        this.auditLogRepository = auditLogRepository;
    }

    @Scheduled(fixedRate = 5000)
    @Transactional
    public void processExpirations() {
        LocalDateTime now = LocalDateTime.now();

        // 1. Process active sessions
        List<OccupancySession> activeSessions = sessionRepository.findByStatus("ACTIVE");
        for (OccupancySession session : activeSessions) {
            long remainingMs = Duration.between(now, session.getExpiresAt()).toMillis();
            if (remainingMs <= 0) {
                session.setStatus("EXPIRED");
                session.setCheckedOutAt(now);
                sessionRepository.save(session);

                seatRepository.findById(session.getSeatId()).ifPresent(seat -> {
                    if (!"MAINTENANCE".equals(seat.getStatus())) {
                        seat.setStatus("AVAILABLE");
                        seatRepository.save(seat);
                    }
                });

                auditLogRepository.save(new AuditLog(
                        1L,
                        "SESSION_AUTO_EXPIRED",
                        "SESSION",
                        String.valueOf(session.getId()),
                        "{\"seatId\":" + session.getSeatId() + ",\"userId\":" + session.getUserId() + "}"
                ));
            } else if (remainingMs <= 10 * 60 * 1000) {
                seatRepository.findById(session.getSeatId()).ifPresent(seat -> {
                    if ("OCCUPIED".equals(seat.getStatus())) {
                        seat.setStatus("EXPIRING_SOON");
                        seatRepository.save(seat);
                    }
                });
            }
        }

        // 2. Process pending reservations past arrival deadline
        List<Reservation> pendingReservations = reservationRepository.findByStatus("PENDING_ACTIVATION");
        for (Reservation resv : pendingReservations) {
            if (now.isAfter(resv.getExpiresAt())) {
                resv.setStatus("EXPIRED");
                reservationRepository.save(resv);

                seatRepository.findById(resv.getSeatId()).ifPresent(seat -> {
                    if ("RESERVED".equals(seat.getStatus())) {
                        seat.setStatus("AVAILABLE");
                        seatRepository.save(seat);
                    }
                });

                auditLogRepository.save(new AuditLog(
                        1L,
                        "RESERVATION_AUTO_EXPIRED",
                        "RESERVATION",
                        String.valueOf(resv.getId()),
                        "{\"seatCode\":\"" + resv.getSeatCode() + "\",\"userId\":" + resv.getUserId() + "}"
                ));
            }
        }
    }
}

