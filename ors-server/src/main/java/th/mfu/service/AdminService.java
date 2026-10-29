package th.mfu.service;

import th.mfu.dto.response.AnalyticsResponse;
import th.mfu.dto.response.QrCodeItemResponse;
import th.mfu.dto.response.UsageDashboardResponse;
import th.mfu.entity.Seat;

import java.util.List;

public interface AdminService {
    AnalyticsResponse getAnalytics();
    UsageDashboardResponse getUsageMetrics(String interval, String startDateStr, String endDateStr);
    List<QrCodeItemResponse> getAllQrCodes(String baseUrl);
    Seat toggleSeatStatus(Long seatId, String status);
    void terminateSession(Long sessionId, String reason);
}

