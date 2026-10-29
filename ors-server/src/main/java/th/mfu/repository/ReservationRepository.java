package th.mfu.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import th.mfu.entity.Reservation;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReservationRepository extends JpaRepository<Reservation, Long> {
    List<Reservation> findByUserIdOrderByCreatedAtDesc(Long userId);
    List<Reservation> findByUserIdAndStatus(Long userId, String status);
    List<Reservation> findBySeatIdAndStatus(Long seatId, String status);
    List<Reservation> findByStatus(String status);
    List<Reservation> findByGroupTableIdAndStatus(Integer groupTableId, String status);
    Optional<Reservation> findFirstBySeatIdAndStatus(Long seatId, String status);
}

