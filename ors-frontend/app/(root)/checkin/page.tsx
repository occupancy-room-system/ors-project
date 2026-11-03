'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/config/routes';
import { useApp } from '@/hooks/use-app-store';
import { QrCheckIn } from './components/qr-check-in';
import { OccupancySession } from '@/types';

export default function CheckInPage() {
  const router = useRouter();
  const { roomData, userReservations, currentUser, openAuthModal, loadData, setActiveSession, showToast } = useApp();

  // For Admin user, strictly redirect to Admin Dashboard
  useEffect(() => {
    if (currentUser?.role === 'ADMINISTRATOR' || currentUser?.role === 'ROLE_ADMIN') {
      router.replace(ROUTES.ADMIN);
    }
  }, [currentUser, router]);

  if (currentUser?.role === 'ADMINISTRATOR' || currentUser?.role === 'ROLE_ADMIN') {
    return null;
  }

  return (
    <QrCheckIn
      seats={roomData.seats}
      userReservations={userReservations}
      currentUser={currentUser}
      onOpenLogin={() => openAuthModal('student')}
      onSessionActivated={async (newSession?: OccupancySession | null) => {
        if (newSession) {
          setActiveSession(newSession);
        }
        await loadData();
        router.push(ROUTES.SESSION);
        showToast('Workstation session activated! Live countdown started in My Session.', 'success');
      }}
      onNavigateToMap={() => router.push(ROUTES.HOME)}
    />
  );
}

