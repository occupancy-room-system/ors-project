'use client';

import { useQuery } from '@tanstack/react-query';
import { healthApi } from '@/utils/api-request/health';
import { DEFAULT_HEALTH } from '@/mock/mock-data';
import { HealthStatus } from '@/types';

export const HEALTH_QUERY_KEY = ['health'] as const;

export function useHealthQuery() {
  return useQuery<HealthStatus>({
    queryKey: HEALTH_QUERY_KEY,
    queryFn: async () => {
      try {
        return await healthApi.getHealth();
      } catch {
        return DEFAULT_HEALTH;
      }
    },
    refetchInterval: 15000,
  });
}

