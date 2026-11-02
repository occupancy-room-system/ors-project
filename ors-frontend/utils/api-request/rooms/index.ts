import { api } from '@/utils/axios';
import { OccupancyMapResponse } from '@/types';

export const roomsApi = {
  getRoomMap: async (roomId: number = 1): Promise<OccupancyMapResponse> => {
    return await api.get<any, OccupancyMapResponse>(`/api/v1/rooms/${roomId}/map`);
  },
};
