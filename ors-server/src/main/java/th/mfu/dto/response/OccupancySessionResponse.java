package th.mfu.dto.response;

public class OccupancySessionResponse {
    private Long id;
    private Long userId;
    private Long seatId;
    private String seatCode;
    private String podLabel;
    private String roomName;
    private String checkedInAt;
    private String expiresAt;
    private String checkedOutAt;
    private String status;
    private long durationMinutes;
    private long minutesRemaining;

    public OccupancySessionResponse() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public Long getSeatId() { return seatId; }
    public void setSeatId(Long seatId) { this.seatId = seatId; }
    public String getSeatCode() { return seatCode; }
    public void setSeatCode(String seatCode) { this.seatCode = seatCode; }
    public String getPodLabel() { return podLabel; }
    public void setPodLabel(String podLabel) { this.podLabel = podLabel; }
    public String getRoomName() { return roomName; }
    public void setRoomName(String roomName) { this.roomName = roomName; }
    public String getCheckedInAt() { return checkedInAt; }
    public void setCheckedInAt(String checkedInAt) { this.checkedInAt = checkedInAt; }
    public String getExpiresAt() { return expiresAt; }
    public void setExpiresAt(String expiresAt) { this.expiresAt = expiresAt; }
    public String getCheckedOutAt() { return checkedOutAt; }
    public void setCheckedOutAt(String checkedOutAt) { this.checkedOutAt = checkedOutAt; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public long getDurationMinutes() { return durationMinutes; }
    public void setDurationMinutes(long durationMinutes) { this.durationMinutes = durationMinutes; }
    public long getMinutesRemaining() { return minutesRemaining; }
    public void setMinutesRemaining(long minutesRemaining) { this.minutesRemaining = minutesRemaining; }
}

