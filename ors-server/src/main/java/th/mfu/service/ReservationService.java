package th.mfu.service;

import th.mfu.dto.request.ReservationCreateRequest;
import th.mfu.entity.Reservation;

import java.util.List;

public interface ReservationService {
    Reservation createReservation(ReservationCreateRequest req);
    List<Reservation> getUserReservations(Long userId);
    void cancelReservation(Long reservationId, Long userId);
}

