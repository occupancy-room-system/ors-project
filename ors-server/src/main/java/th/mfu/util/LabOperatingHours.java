package th.mfu.util;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

public final class LabOperatingHours {

    public static final ZoneId ZONE_ID = ZoneId.of("Asia/Bangkok");
    public static final LocalTime DEFAULT_OPENS_AT = LocalTime.of(9, 0);
    public static final LocalTime DEFAULT_CLOSES_AT = LocalTime.of(17, 0);

    // Kept for backward compatibility and tests
    public static final LocalTime OPENS_AT = DEFAULT_OPENS_AT;
    public static final LocalTime CLOSES_AT = DEFAULT_CLOSES_AT;

    private static volatile LocalTime opensAt = DEFAULT_OPENS_AT;
    private static volatile LocalTime closesAt = DEFAULT_CLOSES_AT;
    private static volatile boolean workstationsEnabled = true;

    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("h:mm a", Locale.ENGLISH);

    private LabOperatingHours() {
    }

    public static LocalTime getOpensAt() {
        return opensAt;
    }

    public static synchronized void setOpensAt(LocalTime time) {
        opensAt = time != null ? time : DEFAULT_OPENS_AT;
    }

    public static synchronized void setOpenHour(int hour) {
        int h = Math.max(0, Math.min(23, hour));
        setOpensAt(LocalTime.of(h, 0));
    }

    public static LocalTime getClosesAt() {
        return closesAt;
    }

    public static synchronized void setClosesAt(LocalTime time) {
        closesAt = time != null ? time : DEFAULT_CLOSES_AT;
    }

    public static synchronized void setCloseHour(int hour) {
        int h = Math.max(1, Math.min(24, hour));
        if (h == 24) {
            setClosesAt(LocalTime.of(23, 59, 59));
        } else {
            setClosesAt(LocalTime.of(h, 0));
        }
    }

    public static boolean isWorkstationsEnabled() {
        return workstationsEnabled;
    }

    public static synchronized void setWorkstationsEnabled(boolean enabled) {
        workstationsEnabled = enabled;
    }

    public static synchronized void reset() {
        opensAt = DEFAULT_OPENS_AT;
        closesAt = DEFAULT_CLOSES_AT;
        workstationsEnabled = true;
    }

    public static String formatTime(LocalTime time) {
        return time.format(TIME_FORMATTER);
    }

    public static LocalDateTime now() {
        return LocalDateTime.now(ZONE_ID);
    }

    public static LocalDateTime openingTime(LocalDate date) {
        return LocalDateTime.of(date, opensAt);
    }

    public static LocalDateTime closingTime(LocalDate date) {
        return LocalDateTime.of(date, closesAt);
    }

    public static boolean isOpenAt(LocalDateTime dateTime) {
        if (!workstationsEnabled) {
            return false;
        }
        LocalTime time = dateTime.toLocalTime();
        return !time.isBefore(opensAt) && time.isBefore(closesAt);
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
