import { api } from '@/utils/axios';
import { HealthStatus } from '@/types';

export const healthApi = {
  getHealth: async (): Promise<HealthStatus> => {
    return await api.get<any, HealthStatus>('/api/v1/health');
  },
};
