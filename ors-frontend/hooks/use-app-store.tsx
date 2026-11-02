'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { User, OccupancyMapResponse, OccupancySession, Reservation } from '@/types';
import { useRoomMapQuery } from './use-room-query';
import { useActiveSessionQuery, useSessionHistoryQuery } from './use-session-query';
import { useUserReservationsQuery } from './use-reservation-query';
import { useHealthQuery } from './use-health-query';
import { DEFAULT_MAP_DATA } from '@/mock/mock-data';

export type ToastMessage = { text: string; type: 'success' | 'error' | 'info' };

interface AppContextValue {
  // Auth
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  isHydrated: boolean;
  isAuthModalOpen: boolean;
  authModalPortal: 'student' | 'admin';
  openAuthModal: (portal?: 'student' | 'admin') => void;
  closeAuthModal: () => void;

  // Room data & backend state
  roomData: OccupancyMapResponse;
  backendOnline: boolean;
  loadData: () => Promise<void>;

  // User session & reservations
  activeSession: OccupancySession | null;
  setActiveSession: (s: OccupancySession | null) => void;
  userReservations: Reservation[];
  sessionHistory: OccupancySession[];

  // Derived counts
  pendingReservationCount: number;

  // Loading
  actionLoading: boolean;
  setActionLoading: (v: boolean) => void;

  // Toast
  toast: ToastMessage | null;
  showToast: (text: string, type?: ToastMessage['type']) => void;
  dismissToast: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>');
  return ctx;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUserState] = useState<User | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalPortal, setAuthModalPortal] = useState<'student' | 'admin'>('student');
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  // Hydrate user from localStorage safely on client mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('ors_user');
      if (stored) {
        setCurrentUserState(JSON.parse(stored) as User);
      }
    } catch (e) {
      console.error('Failed to parse stored user from localStorage', e);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  // Synchronize localStorage with currentUser
  const setCurrentUser = useCallback((user: User | null) => {
    setCurrentUserState(user);
    if (typeof window !== 'undefined') {
      if (user) {
        localStorage.setItem('ors_user', JSON.stringify(user));
        if (user.token) {
          localStorage.setItem('ors_token', user.token);
        }
      } else {
        localStorage.removeItem('ors_user');
        localStorage.removeItem('ors_token');
      }
    }
  }, []);

  // React Query hooks for automated fetching & cache invalidation
  const { data: roomMapData, refetch: refetchRoom } = useRoomMapQuery(1);
  const { data: healthData } = useHealthQuery();
  const { data: activeSessionData, refetch: refetchActiveSession } = useActiveSessionQuery(currentUser?.id);
  const { data: userReservationsData = [], refetch: refetchReservations } = useUserReservationsQuery(currentUser?.id);
  const { data: sessionHistoryData = [], refetch: refetchHistory } = useSessionHistoryQuery(currentUser?.id);

  const [activeSessionOverride, setActiveSessionOverride] = useState<OccupancySession | null | undefined>(undefined);

  const activeSession = activeSessionOverride !== undefined ? activeSessionOverride : (activeSessionData ?? null);

  const setActiveSession = useCallback((s: OccupancySession | null) => {
    setActiveSessionOverride(s);
  }, []);

  const backendOnline = healthData?.databaseConnected ?? true;
  const roomData = roomMapData || DEFAULT_MAP_DATA;

  const showToast = useCallback((text: string, type: ToastMessage['type'] = 'info') => {
    setToast({ text, type });
    setTimeout(() => {
      setToast((current) => (current?.text === text ? null : current));
    }, 4500);
  }, []);

  const dismissToast = useCallback(() => setToast(null), []);

  const openAuthModal = useCallback((portal: 'student' | 'admin' = 'student') => {
    setAuthModalPortal(portal);
    setIsAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => setIsAuthModalOpen(false), []);

  const loadData = useCallback(async () => {
    await Promise.all([
      refetchRoom(),
      currentUser ? refetchActiveSession() : Promise.resolve(),
      currentUser ? refetchReservations() : Promise.resolve(),
      currentUser ? refetchHistory() : Promise.resolve(),
    ]);
  }, [refetchRoom, refetchActiveSession, refetchReservations, refetchHistory, currentUser]);

  const pendingReservationCount = userReservationsData.filter(
    (r) => r.status === 'PENDING_ACTIVATION',
  ).length;

  const value: AppContextValue = {
    currentUser,
    setCurrentUser,
    isHydrated,
    isAuthModalOpen,
    authModalPortal,
    openAuthModal,
    closeAuthModal,
    roomData,
    backendOnline,
    loadData,
    activeSession,
    setActiveSession,
    userReservations: userReservationsData,
    sessionHistory: sessionHistoryData,
    pendingReservationCount,
    actionLoading,
    setActionLoading,
    toast,
    showToast,
    dismissToast,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

