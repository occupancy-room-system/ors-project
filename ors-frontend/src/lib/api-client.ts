import { OccupancyMapResponse, OccupancySession, AnalyticsData, HealthStatus, Seat, Reservation, User, UsageDashboardData } from '../types';

export class ApiClient {
  private static async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(endpoint, {
      headers: {
        'Content-Control': 'no-cache',
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    const json = await response.json();
    if (!response.ok || !json.success) {
      throw new Error(json.message || 'API request failed');
    }

    return json.data as T;
  }

  static login(email: string): Promise<User> {
    return this.request<User>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  static getHealth(): Promise<HealthStatus> {
    return this.request<HealthStatus>('/api/v1/health');
  }

  static getRoomMap(roomId: number = 1): Promise<OccupancyMapResponse> {
    return this.request<OccupancyMapResponse>(`/api/v1/rooms/${roomId}/map`);
  }

  static checkIn(qrToken: string, userId: number): Promise<OccupancySession> {
    return this.request<OccupancySession>('/api/v1/sessions/check-in', {
      method: 'POST',
      body: JSON.stringify({ qrToken, userId, durationMinutes: 120 }),
    });
  }

  static activateSeatWithQr(params: { qrToken?: string; seatCode?: string; userId: number }): Promise<OccupancySession> {
    return this.request<OccupancySession>('/api/v1/sessions/activate-qr', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  static createReservation(params: { userId: number; seatId: number; startTime: string; durationHours: number }): Promise<Reservation> {
    return this.request<Reservation>('/api/v1/reservations', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  static getUserReservations(userId: number): Promise<Reservation[]> {
    return this.request<Reservation[]>(`/api/v1/reservations/me?userId=${userId}`);
  }

  static cancelReservation(reservationId: number, userId: number): Promise<void> {
    return this.request<void>(`/api/v1/reservations/${reservationId}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  }

  static checkOut(sessionId: number, userId: number): Promise<void> {
    return this.request<void>(`/api/v1/sessions/${sessionId}/check-out`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  }

  static getActiveSession(userId: number): Promise<OccupancySession | null> {
    return this.request<OccupancySession | null>(`/api/v1/sessions/me/active?userId=${userId}`);
  }

  static getSessionHistory(userId: number): Promise<OccupancySession[]> {
    return this.request<OccupancySession[]>(`/api/v1/sessions/me/history?userId=${userId}`);
  }

  static getAnalytics(): Promise<AnalyticsData> {
    return this.request<AnalyticsData>('/api/v1/admin/analytics');
  }

  static getAllQRCodes(): Promise<{ seat: Seat; qrDataUrl: string }[]> {
    return this.request<{ seat: Seat; qrDataUrl: string }[]>('/api/v1/admin/qr-codes');
  }

  static toggleSeatStatus(seatId: number, status: string): Promise<Seat> {
    return this.request<Seat>(`/api/v1/admin/seats/${seatId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  static terminateSession(sessionId: number, reason: string): Promise<void> {
    return this.request<void>(`/api/v1/admin/sessions/${sessionId}/terminate`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  static getUsageMetrics(params: {
    interval?: 'daily' | 'weekly' | 'monthly';
    startDate?: string;
    endDate?: string;
  }): Promise<UsageDashboardData> {
    const q = new URLSearchParams();
    if (params.interval) q.set('interval', params.interval);
    if (params.startDate) q.set('startDate', params.startDate);
    if (params.endDate) q.set('endDate', params.endDate);
    return this.request<UsageDashboardData>(`/api/v1/admin/usage-metrics?${q.toString()}`);
  }
}

