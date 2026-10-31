import { request } from './api';
import { OccupancySession } from '@/types';

export const sessionService = {
  checkIn(qrToken: string, userId: number): Promise<OccupancySession> {
    return request<OccupancySession>('/api/v1/sessions/check-in', {
      method: 'POST',
      body: JSON.stringify({ qrToken, userId, durationMinutes: 120 }),
    });
  },

  activateSeatWithQr(params: {
    qrToken?: string;
    seatCode?: string;
    userId: number;
  }): Promise<OccupancySession> {
    return request<OccupancySession>('/api/v1/sessions/activate-qr', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  getActiveSession(userId: number): Promise<OccupancySession | null> {
    return request<OccupancySession | null>(`/api/v1/sessions/me/active?userId=${userId}`);
  },

  getSessionHistory(userId: number): Promise<OccupancySession[]> {
    return request<OccupancySession[]>(`/api/v1/sessions/me/history?userId=${userId}`);
  },

  checkOut(sessionId: number, userId: number): Promise<void> {
    return request<void>(`/api/v1/sessions/${sessionId}/check-out`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  },
};

