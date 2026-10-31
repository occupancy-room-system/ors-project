'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User, OccupancyMapResponse, OccupancySession, Reservation } from '@/types';
import { roomService, authService, sessionService, reservationService } from '@/services';
import { DEFAULT_MAP_DATA } from '@/mock/mock-data';
import config from '@/config';

// ─── Demo User ───────────────────────────────────────────────────────────────
const DEMO_STUDENT: User = {
  id: 2,
  fullName: 'Alex Chen',
  email: 'alex.chen@student.university.edu',
  role: 'STUDENT',
  accountStatus: 'ACTIVE',
};

// ─── Types ────────────────────────────────────────────────────────────────────
export type ToastMessage = { text: string; type: 'success' | 'error' | 'info' };

interface AppContextValue {
  // Auth
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
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
  const [currentUser, setCurrentUser] = useState<User | null>(DEMO_STUDENT);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalPortal, setAuthModalPortal] = useState<'student' | 'admin'>('student');

  const [roomData, setRoomData] = useState<OccupancyMapResponse>(DEFAULT_MAP_DATA);
  const [backendOnline, setBackendOnline] = useState(false);

  const [activeSession, setActiveSession] = useState<OccupancySession | null>(null);
  const [userReservations, setUserReservations] = useState<Reservation[]>([]);
  const [sessionHistory, setSessionHistory] = useState<OccupancySession[]>([]);

  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const showToast = useCallback((text: string, type: ToastMessage['type'] = 'info') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 5000);
  }, []);

  const dismissToast = useCallback(() => setToast(null), []);

  const openAuthModal = useCallback((portal: 'student' | 'admin' = 'student') => {
    setAuthModalPortal(portal);
    setIsAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => setIsAuthModalOpen(false), []);

  const loadData = useCallback(async () => {
    try {
      const [mapRes] = await Promise.all([
        roomService.getRoomMap(config.defaultRoomId),
        authService.getHealth(),
      ]);
      setRoomData(mapRes);
      setBackendOnline(true);

      if (currentUser) {
        const [activeRes, historyRes, resList] = await Promise.all([
          sessionService.getActiveSession(currentUser.id),
          sessionService.getSessionHistory(currentUser.id),
          reservationService.getUserReservations(currentUser.id),
        ]);
        setActiveSession(activeRes);
        setSessionHistory(historyRes);
        setUserReservations(resList);
      } else {
        setActiveSession(null);
        setSessionHistory([]);
        setUserReservations([]);
      }
    } catch {
      setBackendOnline(false);
    }
  }, [currentUser]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, config.pollingIntervalMs);
    return () => clearInterval(interval);
  }, [loadData]);

  const pendingReservationCount = userReservations.filter(
    (r) => r.status === 'PENDING_ACTIVATION',
  ).length;

  const value: AppContextValue = {
    currentUser,
    setCurrentUser,
    isAuthModalOpen,
    authModalPortal,
    openAuthModal,
    closeAuthModal,
    roomData,
    backendOnline,
    loadData,
    activeSession,
    setActiveSession,
    userReservations,
    sessionHistory,
    pendingReservationCount,
    actionLoading,
    setActionLoading,
    toast,
    showToast,
    dismissToast,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

