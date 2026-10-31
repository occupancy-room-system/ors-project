import { request } from './api';
import { HealthStatus, User } from '@/types';

export const authService = {
  login(email: string): Promise<User> {
    return request<User>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  getHealth(): Promise<HealthStatus> {
    return request<HealthStatus>('/api/v1/health');
  },
};

