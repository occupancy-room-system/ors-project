package th.mfu.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "reservations")
public class Reservation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "user_name", nullable = false, length = 100)
    private String userName;

    @Column(name = "user_email", nullable = false, length = 150)
    private String userEmail;

    @Column(name = "seat_id", nullable = false)
    private Long seatId;

    @Column(name = "seat_code", nullable = false, length = 30)
    private String seatCode;

    @Column(name = "pod_label", length = 50)
    private String podLabel;

    @Column(name = "start_time", nullable = false)
    private LocalDateTime startTime;

    @Column(name = "duration_hours", nullable = false)
    private Integer durationHours = 2;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @Column(nullable = false, length = 30)
    private String status = "PENDING_ACTIVATION"; // PENDING_ACTIVATION, ACTIVATED, CANCELLED, EXPIRED

    @Column(name = "is_group_reservation")
    private Boolean isGroupReservation = false;

    @Column(name = "group_table_id")
    private Integer groupTableId;

    @Column(name = "group_table_name", length = 50)
    private String groupTableName;

    @Column(name = "total_seats_reserved")
    private Integer totalSeatsReserved = 1;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public Reservation() {
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        if (this.status == null) this.status = "PENDING_ACTIVATION";
        if (this.isGroupReservation == null) this.isGroupReservation = false;
        if (this.totalSeatsReserved == null) this.totalSeatsReserved = 1;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getUserName() {
        return userName;
    }

    public void setUserName(String userName) {
        this.userName = userName;
    }

    public String getUserEmail() {
        return userEmail;
    }

    public void setUserEmail(String userEmail) {
        this.userEmail = userEmail;
    }

    public Long getSeatId() {
        return seatId;
    }

    public void setSeatId(Long seatId) {
        this.seatId = seatId;
    }

    public String getSeatCode() {
        return seatCode;
    }

    public void setSeatCode(String seatCode) {
        this.seatCode = seatCode;
    }

    public String getPodLabel() {
        return podLabel;
    }

    public void setPodLabel(String podLabel) {
        this.podLabel = podLabel;
    }

    public LocalDateTime getStartTime() {
        return startTime;
    }

    public void setStartTime(LocalDateTime startTime) {
        this.startTime = startTime;
    }

    public Integer getDurationHours() {
        return durationHours;
    }

    public void setDurationHours(Integer durationHours) {
        this.durationHours = durationHours;
    }

    public LocalDateTime getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(LocalDateTime expiresAt) {
        this.expiresAt = expiresAt;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Boolean getIsGroupReservation() {
        return isGroupReservation;
    }

    public void setIsGroupReservation(Boolean isGroupReservation) {
        this.isGroupReservation = isGroupReservation;
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

    public Integer getTotalSeatsReserved() {
        return totalSeatsReserved;
    }

    public void setTotalSeatsReserved(Integer totalSeatsReserved) {
        this.totalSeatsReserved = totalSeatsReserved;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}

