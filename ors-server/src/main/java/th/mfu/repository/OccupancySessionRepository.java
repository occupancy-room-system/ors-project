package th.mfu.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import th.mfu.entity.OccupancySession;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface OccupancySessionRepository extends JpaRepository<OccupancySession, Long> {
    Optional<OccupancySession> findFirstByUserIdAndStatus(Long userId, String status);
    Optional<OccupancySession> findFirstBySeatIdAndStatus(Long seatId, String status);
    List<OccupancySession> findByUserIdOrderByCheckedInAtDesc(Long userId);
    List<OccupancySession> findByStatus(String status);
    List<OccupancySession> findByUserIdAndStatus(Long userId, String status);
    List<OccupancySession> findByCheckedInAtBetween(LocalDateTime start, LocalDateTime end);
}

