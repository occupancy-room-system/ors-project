'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi, UsageMetricsParams } from '@/utils/api-request/admin';
import { AnalyticsData, Seat, UsageDashboardData } from '@/types';
import { ROOM_QUERY_KEY } from './use-room-query';

export const ADMIN_ANALYTICS_QUERY_KEY = ['admin', 'analytics'] as const;
export const ADMIN_QRCODES_QUERY_KEY = ['admin', 'qrcodes'] as const;
export const ADMIN_USAGE_QUERY_KEY = (params: UsageMetricsParams) => ['admin', 'usage', params] as const;

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

export function useToggleSeatStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ seatId, status }: { seatId: number; status: string }) =>
      adminApi.toggleSeatStatus(seatId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ROOM_QUERY_KEY(1) });
      queryClient.invalidateQueries({ queryKey: ADMIN_ANALYTICS_QUERY_KEY });
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
      queryClient.invalidateQueries({ queryKey: ADMIN_ANALYTICS_QUERY_KEY });
    },
  });
}

