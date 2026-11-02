'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/config/routes';
import { useApp } from '@/hooks/use-app-store';
import { QrCheckIn } from './components/qr-check-in';

export default function CheckInPage() {
  const router = useRouter();
  const { roomData, userReservations, currentUser, openAuthModal, loadData, showToast } = useApp();

  return (
    <QrCheckIn
      seats={roomData.seats}
      userReservations={userReservations}
      currentUser={currentUser}
      onOpenLogin={() => openAuthModal('student')}
      onSessionActivated={async () => {
        await loadData();
        router.push(ROUTES.SESSION);
        showToast('Workstation session activated! Live countdown started in My Session.', 'success');
      }}
      onNavigateToMap={() => router.push(ROUTES.HOME)}
    />
  );
}

