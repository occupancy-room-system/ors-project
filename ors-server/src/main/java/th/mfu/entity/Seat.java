package th.mfu.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "seats", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"room_id", "seat_code"}),
    @UniqueConstraint(columnNames = "qr_token")
})
public class Seat {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id", nullable = false)
    @JsonBackReference
    private Room room;

    @Column(name = "seat_code", nullable = false, length = 30)
    private String seatCode;

    @Column(name = "x_position", nullable = false)
    private Integer xPosition;

    @Column(name = "y_position", nullable = false)
    private Integer yPosition;

    @Column(name = "pod_label", length = 50)
    private String podLabel;

    @Column(name = "table_type", nullable = false, length = 20)
    private String tableType = "INDIVIDUAL"; // INDIVIDUAL, GROUP

    @Column(name = "group_table_id")
    private Integer groupTableId;

    @Column(name = "group_table_name", length = 50)
    private String groupTableName;

    @Column(name = "group_capacity")
    private Integer groupCapacity;

    @Column(nullable = false, length = 20)
    private String status = "AVAILABLE"; // AVAILABLE, OCCUPIED, RESERVED, EXPIRING_SOON, MAINTENANCE

    @Column(name = "qr_token", nullable = false, unique = true, length = 100)
    private String qrToken;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public Seat() {
    }

    public Seat(Room room, String seatCode, Integer xPosition, Integer yPosition, String podLabel,
                String tableType, Integer groupTableId, String groupTableName, Integer groupCapacity,
                String status, String qrToken) {
        this.room = room;
        this.seatCode = seatCode;
        this.xPosition = xPosition;
        this.yPosition = yPosition;
        this.podLabel = podLabel;
        this.tableType = tableType != null ? tableType : "INDIVIDUAL";
        this.groupTableId = groupTableId;
        this.groupTableName = groupTableName;
        this.groupCapacity = groupCapacity;
        this.status = status != null ? status : "AVAILABLE";
        this.qrToken = qrToken;
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        if (this.status == null) this.status = "AVAILABLE";
        if (this.tableType == null) this.tableType = "INDIVIDUAL";
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

    public Room getRoom() {
        return room;
    }

    public void setRoom(Room room) {
        this.room = room;
    }

    public String getSeatCode() {
        return seatCode;
    }

    public void setSeatCode(String seatCode) {
        this.seatCode = seatCode;
    }

    public Integer getxPosition() {
        return xPosition;
    }

    public void setxPosition(Integer xPosition) {
        this.xPosition = xPosition;
    }

    public Integer getyPosition() {
        return yPosition;
    }

    public void setyPosition(Integer yPosition) {
        this.yPosition = yPosition;
    }

    public String getPodLabel() {
        return podLabel;
    }

    public void setPodLabel(String podLabel) {
        this.podLabel = podLabel;
    }

    public String getTableType() {
        return tableType;
    }

    public void setTableType(String tableType) {
        this.tableType = tableType;
    }

    public Integer getGroupTableId() {
        return groupTableId;
    }

    public void setGroupTableId(Integer groupTableId) {
        this.groupTableId = groupTableId;
    }

    public String getGroupTableName() {
        return groupTableName;
    }

    public void setGroupTableName(String groupTableName) {
        this.groupTableName = groupTableName;
    }

    public Integer getGroupCapacity() {
        return groupCapacity;
    }

    public void setGroupCapacity(Integer groupCapacity) {
        this.groupCapacity = groupCapacity;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getQrToken() {
        return qrToken;
    }

    public void setQrToken(String qrToken) {
        this.qrToken = qrToken;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}

