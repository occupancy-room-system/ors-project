package th.mfu;

import org.junit.jupiter.api.Test;
import th.mfu.util.LabOperatingHours;

import java.time.LocalDate;
import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class LabOperatingHoursTest {

    private final LocalDate date = LocalDate.of(2026, 11, 7);

    @Test
    void labIsOpenFromNineUntilFiveButNotAtClosing() {
        assertFalse(LabOperatingHours.isOpenAt(date.atTime(8, 59)));
        assertTrue(LabOperatingHours.isOpenAt(date.atTime(9, 0)));
        assertTrue(LabOperatingHours.isOpenAt(date.atTime(16, 59)));
        assertFalse(LabOperatingHours.isOpenAt(date.atTime(17, 0)));
    }

    @Test
    void sessionDurationIsCappedAtClosingTime() {
        assertEquals(date.atTime(17, 0),
                LabOperatingHours.sessionExpiry(date.atTime(16, 0), 3));
        assertEquals(date.atTime(16, 0),
                LabOperatingHours.sessionExpiry(date.atTime(15, 0), 1));
    }

    @Test
    void reservationActivationWindowDoesNotExtendPastClosing() {
        assertEquals(date.atTime(17, 0),
                LabOperatingHours.reservationActivationDeadline(date.atTime(16, 50)));
        assertEquals(date.atTime(16, 20),
                LabOperatingHours.reservationActivationDeadline(date.atTime(16, 0)));
    }
}
