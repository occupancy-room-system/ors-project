package th.mfu.entity;

import jakarta.persistence.*;
import java.time.LocalTime;

@Entity
@Table(name = "operating_hours")
public class OperatingHours {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "opens_at", nullable = false)
    private LocalTime opensAt;

    @Column(name = "closes_at", nullable = false)
    private LocalTime closesAt;

    @Column(name = "enabled", nullable = false)
    private boolean enabled = true;

    public OperatingHours() {}

    public OperatingHours(LocalTime opensAt, LocalTime closesAt, boolean enabled) {
        this.opensAt = opensAt;
        this.closesAt = closesAt;
        this.enabled = enabled;
    }

    public Long getId() {
        return id;
    }

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

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }
}

