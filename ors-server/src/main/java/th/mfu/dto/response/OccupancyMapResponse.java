package th.mfu.dto.response;

import th.mfu.entity.Room;

import java.util.List;

public class OccupancyMapResponse {
    private Room room;
    private List<SeatDto> seats;
    private long totalSeats;
    private long availableSeats;
    private long occupiedSeats;
    private long reservedSeats;
    private double occupancyPercentage;
    private String lastUpdated;

    public OccupancyMapResponse() {}

    public OccupancyMapResponse(Room room, List<SeatDto> seats, long totalSeats, long availableSeats,
                                long occupiedSeats, long reservedSeats, double occupancyPercentage, String lastUpdated) {
        this.room = room;
        this.seats = seats;
        this.totalSeats = totalSeats;
        this.availableSeats = availableSeats;
        this.occupiedSeats = occupiedSeats;
        this.reservedSeats = reservedSeats;
        this.occupancyPercentage = occupancyPercentage;
        this.lastUpdated = lastUpdated;
    }

    public Room getRoom() { return room; }
    public void setRoom(Room room) { this.room = room; }
    public List<SeatDto> getSeats() { return seats; }
    public void setSeats(List<SeatDto> seats) { this.seats = seats; }
    public long getTotalSeats() { return totalSeats; }
    public void setTotalSeats(long totalSeats) { this.totalSeats = totalSeats; }
    public long getAvailableSeats() { return availableSeats; }
    public void setAvailableSeats(long availableSeats) { this.availableSeats = availableSeats; }
    public long getOccupiedSeats() { return occupiedSeats; }
    public void setOccupiedSeats(long occupiedSeats) { this.occupiedSeats = occupiedSeats; }
    public long getReservedSeats() { return reservedSeats; }
    public void setReservedSeats(long reservedSeats) { this.reservedSeats = reservedSeats; }
    public double getOccupancyPercentage() { return occupancyPercentage; }
    public void setOccupancyPercentage(double occupancyPercentage) { this.occupancyPercentage = occupancyPercentage; }
    public String getLastUpdated() { return lastUpdated; }
    public void setLastUpdated(String lastUpdated) { this.lastUpdated = lastUpdated; }
}

