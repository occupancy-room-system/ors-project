package th.mfu.service.impl;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import th.mfu.dto.response.OccupancyMapResponse;
import th.mfu.dto.response.OccupancyMetricsResponse;
import th.mfu.dto.response.SeatDto;
import th.mfu.entity.OccupancySession;
import th.mfu.entity.Reservation;
import th.mfu.entity.Room;
import th.mfu.entity.Seat;
import th.mfu.entity.User;
import th.mfu.exception.ResourceNotFoundException;
import th.mfu.repository.OccupancySessionRepository;
import th.mfu.repository.ReservationRepository;
import th.mfu.repository.RoomRepository;
import th.mfu.repository.SeatRepository;
import th.mfu.repository.UserRepository;
import th.mfu.service.RoomService;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class RoomServiceImpl implements RoomService {

    private final RoomRepository roomRepository;
    private final SeatRepository seatRepository;
    private final OccupancySessionRepository sessionRepository;
    private final ReservationRepository reservationRepository;
    private final UserRepository userRepository;

    public RoomServiceImpl(RoomRepository roomRepository, SeatRepository seatRepository,
                           OccupancySessionRepository sessionRepository, ReservationRepository reservationRepository,
                           UserRepository userRepository) {
        this.roomRepository = roomRepository;
        this.seatRepository = seatRepository;
        this.sessionRepository = sessionRepository;
        this.reservationRepository = reservationRepository;
        this.userRepository = userRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<Room> getAllRooms() {
        return roomRepository.findAll();
    }

    @Override
    @Transactional(readOnly = true)
    public OccupancyMapResponse getRoomMap(Long roomId) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new ResourceNotFoundException("Room", "id", roomId));

        List<Seat> seats = seatRepository.findByRoomIdOrderBySeatCodeAsc(roomId);
        List<SeatDto> seatDtos = new ArrayList<>();

        long availableSeats = 0;
        long occupiedSeats = 0;
        long reservedSeats = 0;

        LocalDateTime now = LocalDateTime.now();

        for (Seat seat : seats) {
            SeatDto dto = new SeatDto();
            dto.setId(seat.getId());
            dto.setRoomId(roomId);
            dto.setSeatCode(seat.getSeatCode());
            dto.setxPosition(seat.getxPosition());
            dto.setyPosition(seat.getyPosition());
            dto.setPodLabel(seat.getPodLabel());
            dto.setStatus(seat.getStatus());
            dto.setQrToken(seat.getQrToken());
            dto.setTableType(seat.getTableType());
            dto.setGroupTableId(seat.getGroupTableId());
            dto.setGroupTableName(seat.getGroupTableName());
            dto.setGroupCapacity(seat.getGroupCapacity());

            if ("AVAILABLE".equals(seat.getStatus())) {
                availableSeats++;
            } else if ("OCCUPIED".equals(seat.getStatus()) || "EXPIRING_SOON".equals(seat.getStatus())) {
                occupiedSeats++;
            } else if ("RESERVED".equals(seat.getStatus())) {
                reservedSeats++;
            }

            // Current active session
            Optional<OccupancySession> activeSessionOpt = sessionRepository.findFirstBySeatIdAndStatus(seat.getId(), "ACTIVE");
            if (activeSessionOpt.isPresent()) {
                OccupancySession s = activeSessionOpt.get();
                long remainingMins = Math.max(0, Duration.between(now, s.getExpiresAt()).toMinutes());
                String userName = "Occupied";
                Optional<User> uOpt = userRepository.findById(s.getUserId());
                if (uOpt.isPresent()) {
                    userName = uOpt.get().getFullName();
                }
                dto.setCurrentSession(new SeatDto.CurrentSessionInfo(
                        s.getId(),
                        userName,
                        s.getCheckedInAt().toString(),
                        s.getExpiresAt().toString(),
                        remainingMins
                ));
            }

            // Current pending reservation
            Optional<Reservation> resvOpt = reservationRepository.findFirstBySeatIdAndStatus(seat.getId(), "PENDING_ACTIVATION");
            resvOpt.ifPresent(dto::setCurrentReservation);

            seatDtos.add(dto);
        }

        long totalSeats = seats.size();
        double occupancyPercentage = totalSeats > 0 ?
                Math.round(((double) (occupiedSeats + reservedSeats) / totalSeats) * 1000.0) / 10.0 : 0.0;

        return new OccupancyMapResponse(
                room,
                seatDtos,
                totalSeats,
                availableSeats,
                occupiedSeats,
                reservedSeats,
                occupancyPercentage,
                now.toString()
        );
    }

    @Override
    @Transactional(readOnly = true)
    public OccupancyMetricsResponse getRoomOccupancy(Long roomId) {
        List<Seat> seats = seatRepository.findByRoomIdOrderBySeatCodeAsc(roomId);
        long totalSeats = seats.size();
        long availableSeats = seats.stream().filter(s -> "AVAILABLE".equals(s.getStatus())).count();
        long occupiedSeats = seats.stream().filter(s -> "OCCUPIED".equals(s.getStatus()) || "EXPIRING_SOON".equals(s.getStatus())).count();
        long reservedSeats = seats.stream().filter(s -> "RESERVED".equals(s.getStatus())).count();

        double occupancyPercentage = totalSeats > 0 ?
                Math.round(((double) (occupiedSeats + reservedSeats) / totalSeats) * 1000.0) / 10.0 : 0.0;

        return new OccupancyMetricsResponse(
                roomId,
                totalSeats,
                availableSeats,
                reservedSeats,
                occupiedSeats,
                occupancyPercentage,
                LocalDateTime.now().toString()
        );
    }
}

