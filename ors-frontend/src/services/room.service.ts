import { request } from './api';
import { OccupancyMapResponse } from '@/types';

export const roomService = {
  getRoomMap(roomId: number = 1): Promise<OccupancyMapResponse> {
    return request<OccupancyMapResponse>(`/api/v1/rooms/${roomId}/map`);
  },
};

