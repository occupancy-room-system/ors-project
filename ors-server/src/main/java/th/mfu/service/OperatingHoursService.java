package th.mfu.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

public interface OperatingHoursService {
    LocalTime getOpensAt();
    LocalTime getClosesAt();
    LocalDateTime closingDateTime(LocalDate date);
    LocalDateTime openingDateTime(LocalDate date);
    boolean isOpenAt(LocalDateTime dateTime);
    boolean isEnabled();
}

