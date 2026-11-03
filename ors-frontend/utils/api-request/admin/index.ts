import { api } from '@/utils/axios';
import { AnalyticsData, Seat, UsageDashboardData, UsageInterval, OccupancySession } from '@/types';

export interface UsageMetricsParams {
  interval?: UsageInterval;
  startDate?: string;
  endDate?: string;
}

export interface SeatUpsertPayload {
  seatCode: string;
  podLabel: string;
  tableType: 'INDIVIDUAL' | 'GROUP';
  groupTableId?: number | null;
  groupTableName?: string | null;
  groupCapacity?: number | null;
  status?: string;
  xPosition?: number;
  yPosition?: number;
  qrToken?: string;
  roomId?: number;
}

export interface SessionsQueryParams {
  userId?: number;
  status?: string;
}

export const adminApi = {
  getAnalytics: async (): Promise<AnalyticsData> => {
    return await api.get<any, AnalyticsData>('/api/v1/admin/analytics');
  },

  getAllQRCodes: async (): Promise<{ seat: Seat; qrDataUrl: string }[]> => {
    return await api.get<any, { seat: Seat; qrDataUrl: string }[]>('/api/v1/admin/qr-codes');
  },

  toggleSeatStatus: async (seatId: number, status: string): Promise<Seat> => {
    return await api.patch<any, Seat>(`/api/v1/admin/seats/${seatId}/status`, { status });
  },

  createSeat: async (payload: SeatUpsertPayload): Promise<Seat> => {
    return await api.post<any, Seat>('/api/v1/admin/seats', payload);
  },

  updateSeat: async (seatId: number, payload: Partial<SeatUpsertPayload>): Promise<Seat> => {
    return await api.put<any, Seat>(`/api/v1/admin/seats/${seatId}`, payload);
  },

  deleteSeat: async (seatId: number): Promise<void> => {
    await api.delete(`/api/v1/admin/seats/${seatId}`);
  },

  getAllSessions: async (params?: SessionsQueryParams): Promise<OccupancySession[]> => {
    const q = new URLSearchParams();
    if (params?.userId) q.set('userId', String(params.userId));
    if (params?.status) q.set('status', params.status);
    return await api.get<any, OccupancySession[]>(`/api/v1/admin/sessions?${q.toString()}`);
  },

  deleteSession: async (sessionId: number): Promise<void> => {
    await api.delete(`/api/v1/admin/sessions/${sessionId}`);
  },

  terminateSession: async (sessionId: number, reason: string): Promise<void> => {
    await api.post(`/api/v1/admin/sessions/${sessionId}/terminate`, { reason });
  },

  getUsageMetrics: async (params: UsageMetricsParams): Promise<UsageDashboardData> => {
    const q = new URLSearchParams();
    if (params.interval) q.set('interval', params.interval);
    if (params.startDate) q.set('startDate', params.startDate);
    if (params.endDate) q.set('endDate', params.endDate);
    return await api.get<any, UsageDashboardData>(`/api/v1/admin/usage-metrics?${q.toString()}`);
  },
};
