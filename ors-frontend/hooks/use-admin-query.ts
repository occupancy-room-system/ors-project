'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi, UsageMetricsParams, SeatUpsertPayload, SessionsQueryParams } from '@/utils/api-request/admin';
import { usersApi, UserCreatePayload, UserUpdatePayload } from '@/utils/api-request/users';
import { AnalyticsData, Seat, UsageDashboardData, User, OccupancySession } from '@/types';
import { ROOM_QUERY_KEY } from './use-room-query';

export const ADMIN_ANALYTICS_QUERY_KEY = ['admin', 'analytics'] as const;
export const ADMIN_QRCODES_QUERY_KEY = ['admin', 'qrcodes'] as const;
export const ADMIN_USAGE_QUERY_KEY = (params: UsageMetricsParams) => ['admin', 'usage', params] as const;
export const ADMIN_USERS_QUERY_KEY = ['admin', 'users'] as const;
export const ADMIN_SESSIONS_QUERY_KEY = (params?: SessionsQueryParams) => ['admin', 'sessions', params] as const;

export function useAdminAnalyticsQuery() {
  return useQuery<AnalyticsData>({
    queryKey: ADMIN_ANALYTICS_QUERY_KEY,
    queryFn: () => adminApi.getAnalytics(),
    refetchInterval: 10000,
  });
}

export function useAdminQRCodesQuery() {
  return useQuery<{ seat: Seat; qrDataUrl: string }[]>({
    queryKey: ADMIN_QRCODES_QUERY_KEY,
    queryFn: () => adminApi.getAllQRCodes(),
    staleTime: 60 * 1000,
  });
}

export function useUsageMetricsQuery(params: UsageMetricsParams) {
  return useQuery<UsageDashboardData>({
    queryKey: ADMIN_USAGE_QUERY_KEY(params),
    queryFn: () => adminApi.getUsageMetrics(params),
    staleTime: 30 * 1000,
  });
}

// Seat Management
export function useToggleSeatStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ seatId, status }: { seatId: number; status: string }) =>
      adminApi.toggleSeatStatus(seatId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      queryClient.invalidateQueries({ queryKey: ROOM_QUERY_KEY(1) });
      queryClient.invalidateQueries({ queryKey: ADMIN_ANALYTICS_QUERY_KEY });
    },
  });
}

export function useCreateSeatMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SeatUpsertPayload) => adminApi.createSeat(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      queryClient.invalidateQueries({ queryKey: ROOM_QUERY_KEY(1) });
      queryClient.invalidateQueries({ queryKey: ADMIN_ANALYTICS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ADMIN_QRCODES_QUERY_KEY });
    },
  });
}

export function useUpdateSeatMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ seatId, payload }: { seatId: number; payload: Partial<SeatUpsertPayload> }) =>
      adminApi.updateSeat(seatId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      queryClient.invalidateQueries({ queryKey: ROOM_QUERY_KEY(1) });
      queryClient.invalidateQueries({ queryKey: ADMIN_ANALYTICS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ADMIN_QRCODES_QUERY_KEY });
    },
  });
}

export function useDeleteSeatMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (seatId: number) => adminApi.deleteSeat(seatId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      queryClient.invalidateQueries({ queryKey: ROOM_QUERY_KEY(1) });
      queryClient.invalidateQueries({ queryKey: ADMIN_ANALYTICS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ADMIN_QRCODES_QUERY_KEY });
    },
  });
}

// User Management & Access Control
export function useAdminUsersQuery() {
  return useQuery<User[]>({
    queryKey: ADMIN_USERS_QUERY_KEY,
    queryFn: () => usersApi.getAllUsers(),
    refetchInterval: 15000,
  });
}

export function useCreateUserMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UserCreatePayload) => usersApi.createUser(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_USERS_QUERY_KEY });
    },
  });
}

export function useUpdateUserMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UserUpdatePayload }) =>
      usersApi.updateUser(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_USERS_QUERY_KEY });
    },
  });
}

export function useDeleteUserMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => usersApi.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_USERS_QUERY_KEY });
    },
  });
}

// Sessions Monitoring
export function useAdminSessionsQuery(params?: SessionsQueryParams) {
  return useQuery<OccupancySession[]>({
    queryKey: ADMIN_SESSIONS_QUERY_KEY(params),
    queryFn: () => adminApi.getAllSessions(params),
    refetchInterval: 10000,
  });
}

export function useDeleteSessionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sessionId: number) => adminApi.deleteSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'sessions'] });
      queryClient.invalidateQueries({ queryKey: ROOM_QUERY_KEY(1) });
    },
  });
}

export function useTerminateSessionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sessionId, reason }: { sessionId: number; reason: string }) =>
      adminApi.terminateSession(sessionId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ROOM_QUERY_KEY(1) });
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'sessions'] });
      queryClient.invalidateQueries({ queryKey: ADMIN_ANALYTICS_QUERY_KEY });
    },
  });
}
