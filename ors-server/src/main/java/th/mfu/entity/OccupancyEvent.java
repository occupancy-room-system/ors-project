package th.mfu.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "occupancy_events")
public class OccupancyEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "session_id", nullable = false)
    private Long sessionId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "seat_id", nullable = false)
    private Long seatId;

    @Column(name = "event_type", nullable = false, length = 50)
    private String eventType; // CHECK_IN, CHECK_OUT, EXPIRED, REMINDER, ADMIN_TERMINATION

    @Column(name = "event_time", nullable = false)
    private LocalDateTime eventTime;

    @Column(columnDefinition = "TEXT")
    private String metadata;

    public OccupancyEvent() {
    }

    public OccupancyEvent(Long sessionId, Long userId, Long seatId, String eventType, String metadata) {
        this.sessionId = sessionId;
        this.userId = userId;
        this.seatId = seatId;
        this.eventType = eventType;
        this.metadata = metadata;
        this.eventTime = LocalDateTime.now();
    }

    @PrePersist
    protected void onCreate() {
        if (this.eventTime == null) {
            this.eventTime = LocalDateTime.now();
        }
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getSessionId() {
        return sessionId;
    }

    public void setSessionId(Long sessionId) {
        this.sessionId = sessionId;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public Long getSeatId() {
        return seatId;
    }

    public void setSeatId(Long seatId) {
        this.seatId = seatId;
    }

    public String getEventType() {
        return eventType;
    }

    public void setEventType(String eventType) {
        this.eventType = eventType;
    }

    public LocalDateTime getEventTime() {
        return eventTime;
    }

    public void setEventTime(LocalDateTime eventTime) {
        this.eventTime = eventTime;
    }

    public String getMetadata() {
        return metadata;
    }

    public void setMetadata(String metadata) {
        this.metadata = metadata;
    }
}

