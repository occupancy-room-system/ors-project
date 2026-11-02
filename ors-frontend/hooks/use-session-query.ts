'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  sessionsApi,
  CheckInParams,
  ActivateQrParams,
} from '@/utils/api-request/sessions';
import { OccupancySession } from '@/types';
import { ROOM_QUERY_KEY } from './use-room-query';
import { RESERVATIONS_QUERY_KEY } from './use-reservation-query';

export const ACTIVE_SESSION_QUERY_KEY = (userId?: number) => ['sessions', 'active', userId] as const;
export const SESSION_HISTORY_QUERY_KEY = (userId?: number) => ['sessions', 'history', userId] as const;

export function useActiveSessionQuery(userId?: number) {
  return useQuery<OccupancySession | null>({
    queryKey: ACTIVE_SESSION_QUERY_KEY(userId),
    queryFn: async () => {
      if (!userId) return null;
      try {
        return await sessionsApi.getActiveSession(userId);
      } catch {
        return null;
      }
    },
    enabled: !!userId,
    refetchInterval: 5000,
  });
}

export function useSessionHistoryQuery(userId?: number) {
  return useQuery<OccupancySession[]>({
    queryKey: SESSION_HISTORY_QUERY_KEY(userId),
    queryFn: async () => {
      if (!userId) return [];
      try {
        return await sessionsApi.getSessionHistory(userId);
      } catch {
        return [];
      }
    },
    enabled: !!userId,
  });
}

export function useCheckInMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: CheckInParams) => sessionsApi.checkIn(params),
    onSuccess: (session, variables) => {
      queryClient.setQueryData(ACTIVE_SESSION_QUERY_KEY(variables.userId), session);
      queryClient.invalidateQueries({ queryKey: SESSION_HISTORY_QUERY_KEY(variables.userId) });
      queryClient.invalidateQueries({ queryKey: RESERVATIONS_QUERY_KEY(variables.userId) });
      queryClient.invalidateQueries({ queryKey: ROOM_QUERY_KEY(1) });
    },
  });
}

export function useActivateQrMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: ActivateQrParams) => sessionsApi.activateSeatWithQr(params),
    onSuccess: (session, variables) => {
      queryClient.setQueryData(ACTIVE_SESSION_QUERY_KEY(variables.userId), session);
      queryClient.invalidateQueries({ queryKey: SESSION_HISTORY_QUERY_KEY(variables.userId) });
      queryClient.invalidateQueries({ queryKey: RESERVATIONS_QUERY_KEY(variables.userId) });
      queryClient.invalidateQueries({ queryKey: ROOM_QUERY_KEY(1) });
    },
  });
}

export function useCheckOutMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sessionId, userId }: { sessionId: number; userId: number }) =>
      sessionsApi.checkOut(sessionId, userId),
    onSuccess: (_, variables) => {
      queryClient.setQueryData(ACTIVE_SESSION_QUERY_KEY(variables.userId), null);
      queryClient.invalidateQueries({ queryKey: SESSION_HISTORY_QUERY_KEY(variables.userId) });
      queryClient.invalidateQueries({ queryKey: ROOM_QUERY_KEY(1) });
    },
  });
}

