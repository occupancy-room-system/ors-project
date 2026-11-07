package th.mfu.util;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;

public final class LabOperatingHours {

    public static final ZoneId ZONE_ID = ZoneId.of("Asia/Bangkok");
    public static final LocalTime OPENS_AT = LocalTime.of(9, 0);
    public static final LocalTime CLOSES_AT = LocalTime.of(17, 0);

    private LabOperatingHours() {
    }

    public static LocalDateTime now() {
        return LocalDateTime.now(ZONE_ID);
    }

    public static LocalDateTime openingTime(LocalDate date) {
        return LocalDateTime.of(date, OPENS_AT);
    }

    public static LocalDateTime closingTime(LocalDate date) {
        return LocalDateTime.of(date, CLOSES_AT);
    }

    public static boolean isOpenAt(LocalDateTime dateTime) {
        LocalTime time = dateTime.toLocalTime();
        return !time.isBefore(OPENS_AT) && time.isBefore(CLOSES_AT);
    }

    public static LocalDateTime sessionExpiry(LocalDateTime checkInTime, int durationHours) {
        LocalDateTime requestedExpiry = checkInTime.plusHours(durationHours);
        return requestedExpiry.isBefore(closingTime(checkInTime.toLocalDate()))
                ? requestedExpiry
                : closingTime(checkInTime.toLocalDate());
    }

    public static LocalDateTime reservationActivationDeadline(LocalDateTime startTime) {
        LocalDateTime requestedDeadline = startTime.plusMinutes(20);
        return requestedDeadline.isBefore(closingTime(startTime.toLocalDate()))
                ? requestedDeadline
                : closingTime(startTime.toLocalDate());
    }
}
