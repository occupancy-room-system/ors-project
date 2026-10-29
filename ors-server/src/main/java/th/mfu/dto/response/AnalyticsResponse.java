package th.mfu.dto.response;

import java.util.List;
import java.util.Map;

public class AnalyticsResponse {
    private List<Map<String, Object>> hourlyOccupancy;
    private List<Map<String, Object>> podUtilization;
    private Map<String, Object> sessionStats;

    public AnalyticsResponse() {}

    public AnalyticsResponse(List<Map<String, Object>> hourlyOccupancy, List<Map<String, Object>> podUtilization, Map<String, Object> sessionStats) {
        this.hourlyOccupancy = hourlyOccupancy;
        this.podUtilization = podUtilization;
        this.sessionStats = sessionStats;
    }

    public List<Map<String, Object>> getHourlyOccupancy() { return hourlyOccupancy; }
    public void setHourlyOccupancy(List<Map<String, Object>> hourlyOccupancy) { this.hourlyOccupancy = hourlyOccupancy; }
    public List<Map<String, Object>> getPodUtilization() { return podUtilization; }
    public void setPodUtilization(List<Map<String, Object>> podUtilization) { this.podUtilization = podUtilization; }
    public Map<String, Object> getSessionStats() { return sessionStats; }
    public void setSessionStats(Map<String, Object> sessionStats) { this.sessionStats = sessionStats; }
}

