package th.mfu.service.impl;

import org.springframework.stereotype.Service;
import th.mfu.entity.OperatingHours;
import th.mfu.repository.OperatingHoursRepository;
import th.mfu.service.OperatingHoursService;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Optional;

@Service
public class OperatingHoursServiceImpl implements OperatingHoursService {

    private final OperatingHoursRepository repository;

    public OperatingHoursServiceImpl(OperatingHoursRepository repository) {
        this.repository = repository;
    }

    private OperatingHours getCurrent() {
        Optional<OperatingHours> opt = repository.findTopByOrderByIdDesc();
        return opt.orElseThrow(() -> new IllegalStateException("Operating hours not configured"));
    }

    @Override
    public LocalTime getOpensAt() {
        return getCurrent().getOpensAt();
    }

    @Override
    public LocalTime getClosesAt() {
        return getCurrent().getClosesAt();
    }

    @Override
    public LocalDateTime openingDateTime(LocalDate date) {
        return LocalDateTime.of(date, getOpensAt());
    }

    @Override
    public LocalDateTime closingDateTime(LocalDate date) {
        return LocalDateTime.of(date, getClosesAt());
    }

    @Override
    public boolean isOpenAt(LocalDateTime dateTime) {
        if (!getCurrent().isEnabled()) {
            return false;
        }
        LocalTime time = dateTime.toLocalTime();
        return !time.isBefore(getOpensAt()) && time.isBefore(getClosesAt());
    }

    @Override
    public boolean isEnabled() {
        return getCurrent().isEnabled();
    }
}

