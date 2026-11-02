import { api } from '@/utils/axios';
import { AnalyticsData, Seat, UsageDashboardData, UsageInterval } from '@/types';

export interface UsageMetricsParams {
  interval?: UsageInterval;
  startDate?: string;
  endDate?: string;
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
