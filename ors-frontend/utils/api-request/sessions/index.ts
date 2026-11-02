import { api } from '@/utils/axios';
import { OccupancySession } from '@/types';

export interface CheckInParams {
  qrToken: string;
  userId: number;
  durationMinutes?: number;
}

export interface ActivateQrParams {
  qrToken?: string;
  seatCode?: string;
  userId: number;
}

export const sessionsApi = {
  checkIn: async (params: CheckInParams): Promise<OccupancySession> => {
    return await api.post<any, OccupancySession>('/api/v1/sessions/check-in', {
      durationMinutes: 120,
      ...params,
    });
  },

  activateSeatWithQr: async (params: ActivateQrParams): Promise<OccupancySession> => {
    return await api.post<any, OccupancySession>('/api/v1/sessions/activate-qr', params);
  },

  getActiveSession: async (userId: number): Promise<OccupancySession | null> => {
    return await api.get<any, OccupancySession | null>(`/api/v1/sessions/me/active?userId=${userId}`);
  },

  getSessionHistory: async (userId: number): Promise<OccupancySession[]> => {
    return await api.get<any, OccupancySession[]>(`/api/v1/sessions/me/history?userId=${userId}`);
  },

  checkOut: async (sessionId: number, userId: number): Promise<void> => {
    await api.post(`/api/v1/sessions/${sessionId}/check-out`, { userId });
  },
};
