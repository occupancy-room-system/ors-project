package th.mfu.service.impl;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import th.mfu.dto.request.ReservationCreateRequest;
import th.mfu.entity.AuditLog;
import th.mfu.entity.OccupancySession;
import th.mfu.entity.Reservation;
import th.mfu.entity.Seat;
import th.mfu.entity.User;
import th.mfu.exception.ApiException;
import th.mfu.repository.AuditLogRepository;
import th.mfu.repository.OccupancySessionRepository;
import th.mfu.repository.ReservationRepository;
import th.mfu.repository.SeatRepository;
import th.mfu.repository.UserRepository;
import th.mfu.service.ReservationService;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class ReservationServiceImpl implements ReservationService {

    private final ReservationRepository reservationRepository;
    private final SeatRepository seatRepository;
    private final UserRepository userRepository;
    private final OccupancySessionRepository sessionRepository;
    private final AuditLogRepository auditLogRepository;

    public ReservationServiceImpl(ReservationRepository reservationRepository, SeatRepository seatRepository,
                                  UserRepository userRepository, OccupancySessionRepository sessionRepository,
                                  AuditLogRepository auditLogRepository) {
        this.reservationRepository = reservationRepository;
        this.seatRepository = seatRepository;
        this.userRepository = userRepository;
        this.sessionRepository = sessionRepository;
        this.auditLogRepository = auditLogRepository;
    }

    @Override
    @Transactional
    public Reservation createReservation(ReservationCreateRequest req) {
        // 1. Validate user
        if (req.getUserId() == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "You must sign in to reserve a laboratory workstation.");
        }
        User user = userRepository.findById(req.getUserId())
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "User profile not found. Please log in."));

        // 2. Validate duration
        int duration = req.getDurationHours() != null ? req.getDurationHours() : 2;
        if (duration < 1 || duration > 4) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Reservation duration must be between 1 hour and 4 hours.");
        }

        // 3. Validate Start Time
        LocalDateTime startTime;
        try {
            if (req.getStartTime().endsWith("Z")) {
                startTime = LocalDateTime.ofInstant(Instant.parse(req.getStartTime()), ZoneOffset.UTC);
            } else {
                startTime = LocalDateTime.parse(req.getStartTime(), DateTimeFormatter.ISO_DATE_TIME);
            }
        } catch (Exception e) {
            startTime = LocalDateTime.now();
        }

        LocalDateTime now = LocalDateTime.now();
        if (startTime.isBefore(now.minusMinutes(5))) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Reservation start time cannot be in the past.");
        }
        if (startTime.isAfter(now.plusMinutes(60))) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Reservations can only be made for arrival within 1 hour of the current time. To prevent workstation hoarding, long-advance bookings are not permitted.");
        }

        // 4. Validate Seat
        Seat seat = seatRepository.findById(req.getSeatId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Workstation not found."));

        boolean isGroup = "GROUP".equalsIgnoreCase(seat.getTableType());
        List<Seat> targetSeats = new ArrayList<>();
        if (isGroup && seat.getGroupTableId() != null) {
            targetSeats = seatRepository.findByGroupTableId(seat.getGroupTableId());
        } else {
            targetSeats.add(seat);
        }

        for (Seat s : targetSeats) {
            if (!"AVAILABLE".equals(s.getStatus())) {
                if (isGroup) {
                    throw new ApiException(HttpStatus.CONFLICT,
                            seat.getPodLabel() + " is currently unavailable (" + s.getSeatCode() + " is " + s.getStatus() + "). All " + targetSeats.size() + " desks in this group table must be free to reserve.");
                } else {
                    throw new ApiException(HttpStatus.CONFLICT,
                            "Workstation " + seat.getSeatCode() + " is currently " + seat.getStatus() + " and cannot be reserved.");
                }
            }
        }

        // 5. Prevent duplicate active session or reservation
        Optional<OccupancySession> activeSession = sessionRepository.findFirstByUserIdAndStatus(user.getId(), "ACTIVE");
        if (activeSession.isPresent()) {
            throw new ApiException(HttpStatus.CONFLICT, "You already have an active workstation session. Please check out first.");
        }

        List<Reservation> activeReservations = reservationRepository.findByUserIdAndStatus(user.getId(), "PENDING_ACTIVATION");
        if (!activeReservations.isEmpty()) {
            Reservation r = activeReservations.get(0);
            throw new ApiException(HttpStatus.CONFLICT,
                    "You already have an active reservation for " + (r.getGroupTableName() != null ? r.getGroupTableName() : r.getSeatCode()) + ". Please activate or cancel it first.");
        }

        // 6. Create Reservations (20 minute activation window from start time)
        LocalDateTime activationDeadline = startTime.plusMinutes(20);
        Reservation primaryReservation = null;

        for (int i = 0; i < targetSeats.size(); i++) {
            Seat s = targetSeats.get(i);
            s.setStatus("RESERVED");
            seatRepository.save(s);

            Reservation r = new Reservation();
            r.setUserId(user.getId());
            r.setUserName(user.getFullName());
            r.setUserEmail(user.getEmail());
            r.setSeatId(s.getId());
            r.setSeatCode(s.getSeatCode());
            r.setPodLabel(s.getPodLabel());
            r.setStartTime(startTime);
            r.setDurationHours(duration);
            r.setExpiresAt(activationDeadline);
            r.setStatus("PENDING_ACTIVATION");
            r.setIsGroupReservation(isGroup);
            r.setGroupTableId(seat.getGroupTableId());
            r.setGroupTableName(seat.getPodLabel());
            r.setTotalSeatsReserved(targetSeats.size());

            Reservation saved = reservationRepository.save(r);
            if (i == 0) {
                primaryReservation = saved;
            }
        }

        auditLogRepository.save(new AuditLog(
                user.getId(),
                isGroup ? "STUDENT_RESERVE_GROUP_TABLE" : "STUDENT_RESERVE_SEAT",
                "RESERVATION",
                String.valueOf(primaryReservation.getId()),
                "{\"tableOrSeat\":\"" + (isGroup ? seat.getPodLabel() : seat.getSeatCode()) + "\",\"durationHours\":" + duration + "}"
        ));

        return primaryReservation;
    }

    @Override
    @Transactional(readOnly = true)
    public List<Reservation> getUserReservations(Long userId) {
        if (userId == null) {
            return List.of();
        }
        return reservationRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    @Override
    @Transactional
    public void cancelReservation(Long reservationId, Long userId) {
        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Reservation not found."));

        if (!"PENDING_ACTIVATION".equals(reservation.getStatus())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Reservation is already " + reservation.getStatus() + ".");
        }

        if (Boolean.TRUE.equals(reservation.getIsGroupReservation()) && reservation.getGroupTableId() != null) {
            List<Reservation> groupRes = reservationRepository.findByGroupTableIdAndStatus(reservation.getGroupTableId(), "PENDING_ACTIVATION");
            for (Reservation r : groupRes) {
                if (r.getUserId().equals(reservation.getUserId())) {
                    r.setStatus("CANCELLED");
                    reservationRepository.save(r);
                    seatRepository.findById(r.getSeatId()).ifPresent(s -> {
                        if ("RESERVED".equals(s.getStatus())) {
                            s.setStatus("AVAILABLE");
                            seatRepository.save(s);
                        }
                    });
                }
            }
        } else {
            reservation.setStatus("CANCELLED");
            reservationRepository.save(reservation);
            seatRepository.findById(reservation.getSeatId()).ifPresent(s -> {
                if ("RESERVED".equals(s.getStatus())) {
                    s.setStatus("AVAILABLE");
                    seatRepository.save(s);
                }
            });
        }

        auditLogRepository.save(new AuditLog(
                userId != null ? userId : reservation.getUserId(),
                "STUDENT_CANCEL_RESERVATION",
                "RESERVATION",
                String.valueOf(reservationId),
                "{\"seatCode\":\"" + reservation.getSeatCode() + "\",\"isGroup\":" + reservation.getIsGroupReservation() + "}"
        ));
    }
}

