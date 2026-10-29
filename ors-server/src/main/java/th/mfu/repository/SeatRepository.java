package th.mfu.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import th.mfu.entity.Seat;

import java.util.List;
import java.util.Optional;

@Repository
public interface SeatRepository extends JpaRepository<Seat, Long> {
    List<Seat> findByRoomIdOrderBySeatCodeAsc(Long roomId);
    List<Seat> findByGroupTableId(Integer groupTableId);
    Optional<Seat> findByQrToken(String qrToken);
    Optional<Seat> findBySeatCode(String seatCode);
    List<Seat> findByStatus(String status);
}

