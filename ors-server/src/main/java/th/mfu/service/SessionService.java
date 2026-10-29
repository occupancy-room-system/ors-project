package th.mfu.service;

import th.mfu.dto.request.QrActivateRequest;
import th.mfu.dto.response.OccupancySessionResponse;

import java.util.List;

public interface SessionService {
    OccupancySessionResponse activateQr(QrActivateRequest req);
    OccupancySessionResponse checkIn(QrActivateRequest req);
    void checkOut(Long sessionId, Long userId);
    OccupancySessionResponse getActiveSession(Long userId);
    List<OccupancySessionResponse> getSessionHistory(Long userId);
}

