'use client';

import { useCallback } from 'react';
import { useApp } from './use-app-store';
import { reservationService, sessionService, adminService } from '@/services';
import { Seat } from '@/types';

export function useActions() {
  const { currentUser, loadData, showToast, setActionLoading, openAuthModal, setActiveSession } =
    useApp();

  const handleConfirmReservation = useCallback(
    async (params: { seatId: number; startTime: string; durationHours: number }) => {
      if (!currentUser) {
        openAuthModal('student');
        return;
      }
      setActionLoading(true);
      try {
        const res = await reservationService.createReservation({
          userId: currentUser.id,
          seatId: params.seatId,
          startTime: params.startTime,
          durationHours: params.durationHours,
        });
        showToast(
          `Workstation ${res.seatCode} reserved for ${res.durationHours}h! Go to QR Check-In to activate.`,
          'success',
        );
        await loadData();
        return res;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Reservation failed';
        showToast(msg, 'error');
        throw err;
      } finally {
        setActionLoading(false);
      }
    },
    [currentUser, loadData, showToast, setActionLoading, openAuthModal],
  );

  const handleCheckOut = useCallback(
    async (sessionId: number) => {
      if (!currentUser) return;
      setActionLoading(true);
      try {
        await sessionService.checkOut(sessionId, currentUser.id);
        setActiveSession(null);
        await loadData();
        showToast('Successfully checked out. Thank you for freeing your workstation!', 'success');
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Checkout failed';
        showToast(msg, 'error');
      } finally {
        setActionLoading(false);
      }
    },
    [currentUser, loadData, showToast, setActionLoading, setActiveSession],
  );

  const handleToggleMaintenance = useCallback(
    async (seat: Seat) => {
      try {
        const newStatus = seat.status === 'MAINTENANCE' ? 'AVAILABLE' : 'MAINTENANCE';
        await adminService.toggleSeatStatus(seat.id, newStatus);
        await loadData();
        showToast(`Workstation ${seat.seatCode} marked as ${newStatus}`, 'info');
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Action failed';
        showToast(msg, 'error');
      }
    },
    [loadData, showToast],
  );

  const handleTerminateSession = useCallback(
    async (sessionId: number, reason: string) => {
      try {
        await adminService.terminateSession(sessionId, reason);
        await loadData();
        showToast(`Session ${sessionId} terminated by administrator`, 'info');
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Termination failed';
        showToast(msg, 'error');
      }
    },
    [loadData, showToast],
  );

  return {
    handleConfirmReservation,
    handleCheckOut,
    handleToggleMaintenance,
    handleTerminateSession,
  };
}

