package th.mfu.dto.response;

import java.util.List;
import java.util.Map;

public class UsageDashboardResponse {
    private Map<String, Object> summary;
    private List<Map<String, Object>> timeline;
    private List<Map<String, Object>> topUsers;
    private String interval;
    private String startDate;
    private String endDate;

    public UsageDashboardResponse() {}

    public UsageDashboardResponse(Map<String, Object> summary, List<Map<String, Object>> timeline,
                                  List<Map<String, Object>> topUsers, String interval, String startDate, String endDate) {
        this.summary = summary;
        this.timeline = timeline;
        this.topUsers = topUsers;
        this.interval = interval;
        this.startDate = startDate;
        this.endDate = endDate;
    }

    public Map<String, Object> getSummary() { return summary; }
    public void setSummary(Map<String, Object> summary) { this.summary = summary; }
    public List<Map<String, Object>> getTimeline() { return timeline; }
    public void setTimeline(List<Map<String, Object>> timeline) { this.timeline = timeline; }
    public List<Map<String, Object>> getTopUsers() { return topUsers; }
    public void setTopUsers(List<Map<String, Object>> topUsers) { this.topUsers = topUsers; }
    public String getInterval() { return interval; }
    public void setInterval(String interval) { this.interval = interval; }
    public String getStartDate() { return startDate; }
    public void setStartDate(String startDate) { this.startDate = startDate; }
    public String getEndDate() { return endDate; }
    public void setEndDate(String endDate) { this.endDate = endDate; }
}

