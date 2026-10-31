import { request } from './api';
import { AnalyticsData, Seat, UsageDashboardData } from '@/types';

export const adminService = {
  getAnalytics(): Promise<AnalyticsData> {
    return request<AnalyticsData>('/api/v1/admin/analytics');
  },

  getAllQRCodes(): Promise<{ seat: Seat; qrDataUrl: string }[]> {
    return request<{ seat: Seat; qrDataUrl: string }[]>('/api/v1/admin/qr-codes');
  },

  toggleSeatStatus(seatId: number, status: string): Promise<Seat> {
    return request<Seat>(`/api/v1/admin/seats/${seatId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  terminateSession(sessionId: number, reason: string): Promise<void> {
    return request<void>(`/api/v1/admin/sessions/${sessionId}/terminate`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },

  getUsageMetrics(params: {
    interval?: 'daily' | 'weekly' | 'monthly';
    startDate?: string;
    endDate?: string;
  }): Promise<UsageDashboardData> {
    const q = new URLSearchParams();
    if (params.interval) q.set('interval', params.interval);
    if (params.startDate) q.set('startDate', params.startDate);
    if (params.endDate) q.set('endDate', params.endDate);
    return request<UsageDashboardData>(`/api/v1/admin/usage-metrics?${q.toString()}`);
  },
};
