import { api } from '@/utils/axios';
import { User, UserRole } from '@/types';

export interface UserCreatePayload {
  studentId: string;
  fullName: string;
  email?: string;
  password?: string;
  role: UserRole;
}

export interface UserUpdatePayload {
  fullName?: string;
  email?: string;
  role?: UserRole;
  password?: string;
}

export const usersApi = {
  getAllUsers: async (): Promise<User[]> => {
    return await api.get<any, User[]>('/api/users');
  },

  getUserById: async (id: number): Promise<User> => {
    return await api.get<any, User>(`/api/users/${id}`);
  },

  createUser: async (payload: UserCreatePayload): Promise<User> => {
    return await api.post<any, User>('/api/users', {
      studentId: payload.studentId.trim(),
      username: payload.studentId.trim(),
      fullName: payload.fullName.trim(),
      email: payload.email?.trim() || `${payload.studentId.trim().toLowerCase()}@student.university.edu`,
      password: payload.password || 'StudentPass123!',
      role: payload.role,
    });
  },

  updateUser: async (id: number, payload: UserUpdatePayload): Promise<User> => {
    return await api.put<any, User>(`/api/users/${id}`, payload);
  },

  deleteUser: async (id: number): Promise<void> => {
    await api.delete(`/api/users/${id}`);
  },
};

