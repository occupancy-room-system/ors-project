package th.mfu.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import th.mfu.entity.OccupancyEvent;

@Repository
public interface OccupancyEventRepository extends JpaRepository<OccupancyEvent, Long> {
}

