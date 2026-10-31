import { request } from './api';
import { Reservation } from '@/types';

export const reservationService = {
  createReservation(params: {
    userId: number;
    seatId: number;
    startTime: string;
    durationHours: number;
  }): Promise<Reservation> {
    return request<Reservation>('/api/v1/reservations', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  getUserReservations(userId: number): Promise<Reservation[]> {
    return request<Reservation[]>(`/api/v1/reservations/me?userId=${userId}`);
  },

  cancelReservation(reservationId: number, userId: number): Promise<void> {
    return request<void>(`/api/v1/reservations/${reservationId}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  },
};

