package th.mfu.dto.response;

public class OccupancyMetricsResponse {
    private Long roomId;
    private long totalSeats;
    private long availableSeats;
    private long reservedSeats;
    private long occupiedSeats;
    private double occupancyPercentage;
    private String timestamp;

    public OccupancyMetricsResponse() {}

    public OccupancyMetricsResponse(Long roomId, long totalSeats, long availableSeats, long reservedSeats,
                                    long occupiedSeats, double occupancyPercentage, String timestamp) {
        this.roomId = roomId;
        this.totalSeats = totalSeats;
        this.availableSeats = availableSeats;
        this.reservedSeats = reservedSeats;
        this.occupiedSeats = occupiedSeats;
        this.occupancyPercentage = occupancyPercentage;
        this.timestamp = timestamp;
    }

    public Long getRoomId() { return roomId; }
    public void setRoomId(Long roomId) { this.roomId = roomId; }
    public long getTotalSeats() { return totalSeats; }
    public void setTotalSeats(long totalSeats) { this.totalSeats = totalSeats; }
    public long getAvailableSeats() { return availableSeats; }
    public void setAvailableSeats(long availableSeats) { this.availableSeats = availableSeats; }
    public long getReservedSeats() { return reservedSeats; }
    public void setReservedSeats(long reservedSeats) { this.reservedSeats = reservedSeats; }
    public long getOccupiedSeats() { return occupiedSeats; }
    public void setOccupiedSeats(long occupiedSeats) { this.occupiedSeats = occupiedSeats; }
    public double getOccupancyPercentage() { return occupancyPercentage; }
    public void setOccupancyPercentage(double occupancyPercentage) { this.occupancyPercentage = occupancyPercentage; }
    public String getTimestamp() { return timestamp; }
    public void setTimestamp(String timestamp) { this.timestamp = timestamp; }
}

