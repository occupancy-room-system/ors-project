package th.mfu.service.impl;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import th.mfu.dto.request.QrActivateRequest;
import th.mfu.dto.response.OccupancySessionResponse;
import th.mfu.entity.AuditLog;
import th.mfu.entity.OccupancySession;
import th.mfu.entity.Reservation;
import th.mfu.entity.Room;
import th.mfu.entity.Seat;
import th.mfu.exception.ApiException;
import th.mfu.repository.AuditLogRepository;
import th.mfu.repository.OccupancySessionRepository;
import th.mfu.repository.ReservationRepository;
import th.mfu.repository.RoomRepository;
import th.mfu.repository.SeatRepository;
import th.mfu.service.SessionService;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class SessionServiceImpl implements SessionService {

    private final OccupancySessionRepository sessionRepository;
    private final SeatRepository seatRepository;
    private final ReservationRepository reservationRepository;
    private final RoomRepository roomRepository;
    private final AuditLogRepository auditLogRepository;

    public SessionServiceImpl(OccupancySessionRepository sessionRepository, SeatRepository seatRepository,
                              ReservationRepository reservationRepository, RoomRepository roomRepository,
                              AuditLogRepository auditLogRepository) {
        this.sessionRepository = sessionRepository;
        this.seatRepository = seatRepository;
        this.reservationRepository = reservationRepository;
        this.roomRepository = roomRepository;
        this.auditLogRepository = auditLogRepository;
    }

    @Override
    @Transactional
    public OccupancySessionResponse activateQr(QrActivateRequest req) {
        Long userId = req.getUserId() != null ? req.getUserId() : 2L;

        Seat seat = null;
        if (req.getQrToken() != null && !req.getQrToken().isEmpty()) {
            seat = seatRepository.findByQrToken(req.getQrToken()).orElse(null);
        }
        if (seat == null && req.getSeatCode() != null && !req.getSeatCode().isEmpty()) {
            seat = seatRepository.findBySeatCode(req.getSeatCode()).orElse(null);
        }

        if (seat == null) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Physical QR code not recognized. Workstation not found.");
        }

        if ("MAINTENANCE".equals(seat.getStatus())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Workstation " + seat.getSeatCode() + " is currently under maintenance.");
        }

        // 1. Check if user already has an active ongoing session
        Optional<OccupancySession> existingActive = sessionRepository.findFirstByUserIdAndStatus(userId, "ACTIVE");
        if (existingActive.isPresent()) {
            Seat curSeat = seatRepository.findById(existingActive.get().getSeatId()).orElse(null);
            throw new ApiException(HttpStatus.CONFLICT,
                    "You already have an active session at " + (curSeat != null ? curSeat.getSeatCode() : "another desk") + ". Please check out first before activating a new workstation.");
        }

        // 2. Check if user has an active pending reservation
        List<Reservation> userPending = reservationRepository.findByUserIdAndStatus(userId, "PENDING_ACTIVATION");
        Reservation userPendingReservation = userPending.isEmpty() ? null : userPending.get(0);

        if (userPendingReservation != null) {
            boolean isMatching = userPendingReservation.getSeatId().equals(seat.getId()) ||
                    (Boolean.TRUE.equals(userPendingReservation.getIsGroupReservation()) &&
                            userPendingReservation.getGroupTableId() != null &&
                            seat.getGroupTableId() != null &&
                            seat.getGroupTableId().equals(userPendingReservation.getGroupTableId()));

            if (!isMatching) {
                throw new ApiException(HttpStatus.BAD_REQUEST,
                        "Warning: You reserved " + (userPendingReservation.getGroupTableName() != null ? userPendingReservation.getGroupTableName() : userPendingReservation.getSeatCode()) +
                                ". The QR code scanned is for " + seat.getSeatCode() + ". You cannot access this workstation. Please scan the QR code on your reserved table/desk.");
            }
        } else {
            // No pending reservation
            if ("RESERVED".equals(seat.getStatus())) {
                throw new ApiException(HttpStatus.CONFLICT,
                        "Workstation " + seat.getSeatCode() + " is UNAVAILABLE! This desk is currently reserved by another student. Please select an available green desk.");
            }
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "No reservation found for workstation " + seat.getSeatCode() + ". You must reserve this seat from the 2D floor plan first before scanning its QR code to activate.");
        }

        // 3. Check if seat is currently occupied
        if ("OCCUPIED".equals(seat.getStatus()) || "EXPIRING_SOON".equals(seat.getStatus())) {
            throw new ApiException(HttpStatus.CONFLICT,
                    "Workstation " + seat.getSeatCode() + " is UNAVAILABLE! This desk is currently occupied by another student session.");
        }

        // 4. Activate the user's matched reservation
        int durationMinutes = userPendingReservation.getDurationHours() * 60;
        LocalDateTime checkInTime = LocalDateTime.now();
        LocalDateTime expiryTime = checkInTime.plusMinutes(durationMinutes);

        OccupancySession primarySession = null;

        if (Boolean.TRUE.equals(userPendingReservation.getIsGroupReservation()) && userPendingReservation.getGroupTableId() != null) {
            List<Seat> groupSeats = seatRepository.findByGroupTableId(userPendingReservation.getGroupTableId());
            List<Reservation> allTableReservations = reservationRepository.findByGroupTableIdAndStatus(userPendingReservation.getGroupTableId(), "PENDING_ACTIVATION");
            for (Reservation r : allTableReservations) {
                if (r.getUserId().equals(userId)) {
                    r.setStatus("ACTIVATED");
                    reservationRepository.save(r);
                }
            }

            for (int i = 0; i < groupSeats.size(); i++) {
                Seat s = groupSeats.get(i);
                s.setStatus("OCCUPIED");
                seatRepository.save(s);

                OccupancySession session = new OccupancySession();
                session.setUserId(userId);
                session.setSeatId(s.getId());
                session.setCheckedInAt(checkInTime);
                session.setExpiresAt(expiryTime);
                session.setStatus("ACTIVE");
                OccupancySession saved = sessionRepository.save(session);

                if (s.getId().equals(seat.getId()) || i == 0) {
                    primarySession = saved;
                }
            }

            auditLogRepository.save(new AuditLog(
                    userId,
                    "GROUP_RESERVATION_ACTIVATED_QR",
                    "SESSION",
                    String.valueOf(primarySession.getId()),
                    "{\"table\":\"" + seat.getPodLabel() + "\",\"totalDesks\":" + groupSeats.size() + ",\"durationMinutes\":" + durationMinutes + "}"
            ));
        } else {
            userPendingReservation.setStatus("ACTIVATED");
            reservationRepository.save(userPendingReservation);

            seat.setStatus("OCCUPIED");
            seatRepository.save(seat);

            OccupancySession session = new OccupancySession();
            session.setUserId(userId);
            session.setSeatId(seat.getId());
            session.setCheckedInAt(checkInTime);
            session.setExpiresAt(expiryTime);
            session.setStatus("ACTIVE");
            primarySession = sessionRepository.save(session);

            auditLogRepository.save(new AuditLog(
                    userId,
                    "RESERVATION_ACTIVATED_QR",
                    "SESSION",
                    String.valueOf(primarySession.getId()),
                    "{\"seatCode\":\"" + seat.getSeatCode() + "\",\"durationMinutes\":" + durationMinutes + "}"
            ));
        }

        Room room = roomRepository.findById(seat.getRoom().getId()).orElse(null);

        OccupancySessionResponse resp = new OccupancySessionResponse();
        resp.setId(primarySession.getId());
        resp.setUserId(userId);
        resp.setSeatId(seat.getId());
        resp.setSeatCode(seat.getSeatCode());
        resp.setPodLabel(seat.getPodLabel());
        resp.setRoomName(room != null ? room.getName() : "Software Engineering Lab");
        resp.setCheckedInAt(primarySession.getCheckedInAt().toString());
        resp.setExpiresAt(primarySession.getExpiresAt().toString());
        resp.setStatus("ACTIVE");
        resp.setDurationMinutes(durationMinutes);
        resp.setMinutesRemaining(durationMinutes);

        return resp;
    }

    @Override
    @Transactional
    public OccupancySessionResponse checkIn(QrActivateRequest req) {
        return activateQr(req);
    }

    @Override
    @Transactional
    public void checkOut(Long sessionId, Long userId) {
        OccupancySession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Session " + sessionId + " not found"));

        if (!"ACTIVE".equals(session.getStatus())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Session is already " + session.getStatus());
        }

        Seat curSeat = seatRepository.findById(session.getSeatId()).orElse(null);

        if (curSeat != null && "GROUP".equalsIgnoreCase(curSeat.getTableType()) && curSeat.getGroupTableId() != null) {
            List<OccupancySession> activeUserSessions = sessionRepository.findByUserIdAndStatus(session.getUserId(), "ACTIVE");
            for (OccupancySession s : activeUserSessions) {
                Seat st = seatRepository.findById(s.getSeatId()).orElse(null);
                if (st != null && curSeat.getGroupTableId().equals(st.getGroupTableId())) {
                    s.setStatus("CHECKED_OUT");
                    s.setCheckedOutAt(LocalDateTime.now());
                    sessionRepository.save(s);

                    if ("OCCUPIED".equals(st.getStatus()) || "EXPIRING_SOON".equals(st.getStatus())) {
                        st.setStatus("AVAILABLE");
                        seatRepository.save(st);
                    }
                }
            }
        } else {
            session.setStatus("CHECKED_OUT");
            session.setCheckedOutAt(LocalDateTime.now());
            sessionRepository.save(session);

            if (curSeat != null && !"MAINTENANCE".equals(curSeat.getStatus())) {
                curSeat.setStatus("AVAILABLE");
                seatRepository.save(curSeat);
            }
        }

        auditLogRepository.save(new AuditLog(
                userId != null ? userId : session.getUserId(),
                "STUDENT_CHECK_OUT",
                "SESSION",
                String.valueOf(sessionId),
                "{\"seatCode\":\"" + (curSeat != null ? curSeat.getSeatCode() : "") + "\"}"
        ));
    }

    @Override
    @Transactional(readOnly = true)
    public OccupancySessionResponse getActiveSession(Long userId) {
        if (userId == null) return null;

        Optional<OccupancySession> activeOpt = sessionRepository.findFirstByUserIdAndStatus(userId, "ACTIVE");
        if (activeOpt.isEmpty()) {
            return null;
        }

        OccupancySession session = activeOpt.get();
        Seat seat = seatRepository.findById(session.getSeatId()).orElse(null);
        Room room = seat != null ? roomRepository.findById(seat.getRoom().getId()).orElse(null) : null;

        LocalDateTime now = LocalDateTime.now();
        long minutesRemaining = Math.max(0, Duration.between(now, session.getExpiresAt()).toMinutes());
        long totalDurationMinutes = Math.max(1, Duration.between(session.getCheckedInAt(), session.getExpiresAt()).toMinutes());

        OccupancySessionResponse resp = new OccupancySessionResponse();
        resp.setId(session.getId());
        resp.setUserId(session.getUserId());
        resp.setSeatId(seat != null ? seat.getId() : null);
        resp.setSeatCode(seat != null ? seat.getSeatCode() : "SEAT-??");
        resp.setPodLabel(seat != null ? seat.getPodLabel() : "");
        resp.setRoomName(room != null ? room.getName() : "Software Engineering Lab");
        resp.setCheckedInAt(session.getCheckedInAt().toString());
        resp.setExpiresAt(session.getExpiresAt().toString());
        resp.setStatus(session.getStatus());
        resp.setDurationMinutes(totalDurationMinutes);
        resp.setMinutesRemaining(minutesRemaining);

        return resp;
    }

    @Override
    @Transactional(readOnly = true)
    public List<OccupancySessionResponse> getSessionHistory(Long userId) {
        if (userId == null) return List.of();

        List<OccupancySession> sessions = sessionRepository.findByUserIdOrderByCheckedInAtDesc(userId);
        List<OccupancySessionResponse> responses = new ArrayList<>();

        for (OccupancySession s : sessions) {
            Seat seat = seatRepository.findById(s.getSeatId()).orElse(null);
            Room room = seat != null ? roomRepository.findById(seat.getRoom().getId()).orElse(null) : null;

            LocalDateTime end = s.getCheckedOutAt() != null ? s.getCheckedOutAt() : s.getExpiresAt();
            long durationMins = Math.max(0, Duration.between(s.getCheckedInAt(), end).toMinutes());

            OccupancySessionResponse resp = new OccupancySessionResponse();
            resp.setId(s.getId());
            resp.setUserId(s.getUserId());
            resp.setSeatId(seat != null ? seat.getId() : null);
            resp.setSeatCode(seat != null ? seat.getSeatCode() : "SEAT-??");
            resp.setPodLabel(seat != null ? seat.getPodLabel() : "");
            resp.setRoomName(room != null ? room.getName() : "Software Engineering Lab");
            resp.setCheckedInAt(s.getCheckedInAt().toString());
            resp.setExpiresAt(s.getExpiresAt().toString());
            resp.setCheckedOutAt(s.getCheckedOutAt() != null ? s.getCheckedOutAt().toString() : null);
            resp.setStatus(s.getStatus());
            resp.setDurationMinutes(durationMins);

            responses.add(resp);
        }

        return responses;
    }
}

