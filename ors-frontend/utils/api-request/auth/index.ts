import { api } from '@/utils/axios';
import { User } from '@/types';

export interface LoginPayload {
  studentId?: string;
  usernameOrEmail?: string;
  password: string;
}

export interface RegisterPayload {
  studentId: string;
  fullName: string;
  password: string;
  username?: string;
  email?: string;
}

export interface AuthResponseData {
  token: string;
  type: string;
  user: {
    id: number;
    username: string;
    email: string;
    fullName: string;
    role: string;
  };
}

export const authApi = {
  login: async (payload: LoginPayload): Promise<{ token: string; user: User }> => {
    const studentId = (payload.studentId || payload.usernameOrEmail || '').trim();
    const res = await api.post<any, AuthResponseData>('/api/auth/login', {
      studentId,
      usernameOrEmail: studentId,
      password: payload.password,
    });

    const user: User = {
      id: res.user.id,
      username: res.user.username,
      fullName: res.user.fullName || res.user.username,
      email: res.user.email,
      role: res.user.role as any,
      accountStatus: 'ACTIVE',
      token: res.token,
    };

    if (typeof window !== 'undefined') {
      localStorage.setItem('ors_token', res.token);
      localStorage.setItem('ors_user', JSON.stringify(user));
    }

    return { token: res.token, user };
  },

  register: async (payload: RegisterPayload): Promise<User> => {
    const studentId = (payload.studentId || payload.username || '').trim();
    const res = await api.post<any, {
      id: number;
      username: string;
      email: string;
      fullName: string;
      role: string;
    }>('/api/auth/register', {
      studentId,
      username: studentId,
      fullName: payload.fullName.trim(),
      password: payload.password,
      email: payload.email || `${studentId}@student.university.edu`,
    });

    return {
      id: res.id,
      username: res.username,
      fullName: res.fullName || res.username,
      email: res.email,
      role: res.role as any,
      accountStatus: 'ACTIVE',
    };
  },

  getCurrentUser: async (): Promise<User> => {
    const res = await api.get<any, {
      id: number;
      username: string;
      email: string;
      fullName: string;
      role: string;
    }>('/api/auth/me');

    return {
      id: res.id,
      username: res.username,
      fullName: res.fullName || res.username,
      email: res.email,
      role: res.role as any,
      accountStatus: 'ACTIVE',
    };
  },

  logout: (): void => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('ors_token');
      localStorage.removeItem('ors_user');
    }
  },

  getStoredUser: (): User | null => {
    if (typeof window === 'undefined') return null;
    try {
      const stored = localStorage.getItem('ors_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  },
};

