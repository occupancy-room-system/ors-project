'use client';

import { useQuery } from '@tanstack/react-query';
import { roomsApi } from '@/utils/api-request/rooms';
import { DEFAULT_MAP_DATA } from '@/mock/mock-data';
import { OccupancyMapResponse } from '@/types';
import config from '@/config';

export const ROOM_QUERY_KEY = (roomId: number = 1) => ['rooms', roomId, 'map'] as const;

export function useRoomMapQuery(roomId: number = 1) {
  return useQuery<OccupancyMapResponse>({
    queryKey: ROOM_QUERY_KEY(roomId),
    queryFn: async () => {
      try {
        return await roomsApi.getRoomMap(roomId);
      } catch (err) {
        console.warn('Backend unavailable, using fallback mock map data:', err);
        return DEFAULT_MAP_DATA;
      }
    },
    initialData: DEFAULT_MAP_DATA,
    refetchInterval: config.pollingIntervalMs,
    staleTime: 5000,
  });
}

