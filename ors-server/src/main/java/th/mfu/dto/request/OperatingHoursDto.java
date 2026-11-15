package th.mfu.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalTime;

public class OperatingHoursDto {

    @NotNull(message = "Opening time is required")
    private LocalTime opensAt;

    @NotNull(message = "Closing time is required")
    private LocalTime closesAt;

    @NotNull(message = "Enabled flag is required")
    private Boolean enabled;

    public LocalTime getOpensAt() {
        return opensAt;
    }

    public void setOpensAt(LocalTime opensAt) {
        this.opensAt = opensAt;
    }

    public LocalTime getClosesAt() {
        return closesAt;
    }

    public void setClosesAt(LocalTime closesAt) {
        this.closesAt = closesAt;
    }

    public Boolean getEnabled() {
        return enabled;
    }

    public void setEnabled(Boolean enabled) {
        this.enabled = enabled;
    }
}

