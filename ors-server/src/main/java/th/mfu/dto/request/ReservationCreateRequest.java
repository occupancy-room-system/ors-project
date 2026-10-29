package th.mfu.dto.request;

import jakarta.validation.constraints.NotNull;

public class ReservationCreateRequest {
    @NotNull
    private Long userId;

    @NotNull
    private Long seatId;

    @NotNull
    private String startTime;

    @NotNull
    private Integer durationHours;

    public ReservationCreateRequest() {}

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public Long getSeatId() { return seatId; }
    public void setSeatId(Long seatId) { this.seatId = seatId; }
    public String getStartTime() { return startTime; }
    public void setStartTime(String startTime) { this.startTime = startTime; }
    public Integer getDurationHours() { return durationHours; }
    public void setDurationHours(Integer durationHours) { this.durationHours = durationHours; }
}

