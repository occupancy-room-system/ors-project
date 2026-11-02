'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi, LoginPayload, RegisterPayload } from '@/utils/api-request/auth';
import { User } from '@/types';

export const AUTH_QUERY_KEY = ['auth', 'currentUser'] as const;

export function useCurrentUserQuery() {
  return useQuery({
    queryKey: AUTH_QUERY_KEY,
    queryFn: async () => {
      const stored = authApi.getStoredUser();
      if (!stored?.token) return null;
      try {
        return await authApi.getCurrentUser();
      } catch {
        return stored;
      }
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useLoginMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: LoginPayload) => authApi.login(payload),
    onSuccess: (data) => {
      queryClient.setQueryData(AUTH_QUERY_KEY, data.user);
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
    },
  });
}

export function useRegisterMutation() {
  return useMutation({
    mutationFn: (payload: RegisterPayload) => authApi.register(payload),
  });
}

export function useLogoutMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      authApi.logout();
    },
    onSuccess: () => {
      queryClient.setQueryData(AUTH_QUERY_KEY, null);
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
    },
  });
}

