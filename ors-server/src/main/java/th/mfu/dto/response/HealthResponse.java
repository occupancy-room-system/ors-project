package th.mfu.dto.response;

public class HealthResponse {
    private String service;
    private String status;
    private String framework;
    private int databaseTargetPort;
    private boolean databaseConnected;
    private long activeSessions;
    private long totalSeats;

    public HealthResponse() {}

    public HealthResponse(String service, String status, String framework, int databaseTargetPort, boolean databaseConnected, long activeSessions, long totalSeats) {
        this.service = service;
        this.status = status;
        this.framework = framework;
        this.databaseTargetPort = databaseTargetPort;
        this.databaseConnected = databaseConnected;
        this.activeSessions = activeSessions;
        this.totalSeats = totalSeats;
    }

    public String getService() { return service; }
    public void setService(String service) { this.service = service; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getFramework() { return framework; }
    public void setFramework(String framework) { this.framework = framework; }
    public int getDatabaseTargetPort() { return databaseTargetPort; }
    public void setDatabaseTargetPort(int databaseTargetPort) { this.databaseTargetPort = databaseTargetPort; }
    public boolean isDatabaseConnected() { return databaseConnected; }
    public void setDatabaseConnected(boolean databaseConnected) { this.databaseConnected = databaseConnected; }
    public long getActiveSessions() { return activeSessions; }
    public void setActiveSessions(long activeSessions) { this.activeSessions = activeSessions; }
    public long getTotalSeats() { return totalSeats; }
    public void setTotalSeats(long totalSeats) { this.totalSeats = totalSeats; }
}

