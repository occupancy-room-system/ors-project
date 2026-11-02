'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { reservationsApi, CreateReservationParams } from '@/utils/api-request/reservations';
import { Reservation } from '@/types';
import { ROOM_QUERY_KEY } from './use-room-query';

export const RESERVATIONS_QUERY_KEY = (userId?: number) => ['reservations', userId] as const;

export function useUserReservationsQuery(userId?: number) {
  return useQuery<Reservation[]>({
    queryKey: RESERVATIONS_QUERY_KEY(userId),
    queryFn: async () => {
      if (!userId) return [];
      try {
        return await reservationsApi.getUserReservations(userId);
      } catch {
        return [];
      }
    },
    enabled: !!userId,
    refetchInterval: 10000,
  });
}

export function useCreateReservationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: CreateReservationParams) => reservationsApi.createReservation(params),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: RESERVATIONS_QUERY_KEY(variables.userId) });
      queryClient.invalidateQueries({ queryKey: ROOM_QUERY_KEY(1) });
    },
  });
}

export function useCancelReservationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ reservationId, userId }: { reservationId: number; userId: number }) =>
      reservationsApi.cancelReservation(reservationId, userId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: RESERVATIONS_QUERY_KEY(variables.userId) });
      queryClient.invalidateQueries({ queryKey: ROOM_QUERY_KEY(1) });
    },
  });
}

