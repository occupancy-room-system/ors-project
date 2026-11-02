import { api } from '@/utils/axios';
import { Reservation } from '@/types';

export interface CreateReservationParams {
  userId: number;
  seatId: number;
  startTime: string;
  durationHours: number;
}

export const reservationsApi = {
  createReservation: async (params: CreateReservationParams): Promise<Reservation> => {
    return await api.post<any, Reservation>('/api/v1/reservations', params);
  },

  getUserReservations: async (userId: number): Promise<Reservation[]> => {
    return await api.get<any, Reservation[]>(`/api/v1/reservations/me?userId=${userId}`);
  },

  cancelReservation: async (reservationId: number, userId: number): Promise<void> => {
    await api.post(`/api/v1/reservations/${reservationId}/cancel`, { userId });
  },
};
