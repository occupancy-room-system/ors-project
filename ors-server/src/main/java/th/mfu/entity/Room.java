package th.mfu.entity;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "rooms")
public class Room {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "room_code", nullable = false, unique = true, length = 50)
    private String roomCode;

    @Column(name = "name", nullable = false, length = 120)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, length = 100)
    private String building;

    @Column(name = "floor_level", nullable = false)
    private Integer floorLevel = 1;

    @Column(name = "width_units", nullable = false)
    private Integer widthUnits = 14;

    @Column(name = "height_units", nullable = false)
    private Integer heightUnits = 10;

    @Column(nullable = false, length = 20)
    private String status = "ACTIVE";

    @OneToMany(mappedBy = "room", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private List<Seat> seats = new ArrayList<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public Room() {
    }

    public Room(String roomCode, String name, String description, String building, Integer floorLevel, Integer widthUnits, Integer heightUnits, String status) {
        this.roomCode = roomCode;
        this.name = name;
        this.description = description;
        this.building = building;
        this.floorLevel = floorLevel != null ? floorLevel : 1;
        this.widthUnits = widthUnits != null ? widthUnits : 14;
        this.heightUnits = heightUnits != null ? heightUnits : 10;
        this.status = status != null ? status : "ACTIVE";
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        if (this.status == null) this.status = "ACTIVE";
        if (this.floorLevel == null) this.floorLevel = 1;
        if (this.widthUnits == null) this.widthUnits = 14;
        if (this.heightUnits == null) this.heightUnits = 10;
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getRoomCode() {
        return roomCode;
    }

    public void setRoomCode(String roomCode) {
        this.roomCode = roomCode;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getBuilding() {
        return building;
    }

    public void setBuilding(String building) {
        this.building = building;
    }

    public Integer getFloorLevel() {
        return floorLevel;
    }

    public void setFloorLevel(Integer floorLevel) {
        this.floorLevel = floorLevel;
    }

    public Integer getWidthUnits() {
        return widthUnits;
    }

    public void setWidthUnits(Integer widthUnits) {
        this.widthUnits = widthUnits;
    }

    public Integer getHeightUnits() {
        return heightUnits;
    }

    public void setHeightUnits(Integer heightUnits) {
        this.heightUnits = heightUnits;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public List<Seat> getSeats() {
        return seats;
    }

    public void setSeats(List<Seat> seats) {
        this.seats = seats;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}
