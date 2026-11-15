package th.mfu.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import th.mfu.entity.OperatingHours;
import java.util.Optional;

public interface OperatingHoursRepository extends JpaRepository<OperatingHours, Long> {
    Optional<OperatingHours> findTopByOrderByIdDesc();
}

