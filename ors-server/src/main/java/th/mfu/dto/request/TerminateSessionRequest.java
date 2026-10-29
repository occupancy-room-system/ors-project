package th.mfu.dto.request;

public class TerminateSessionRequest {
    private String reason;

    public TerminateSessionRequest() {}

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
}

