'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/config';
import { useApp } from '@/hooks/use-app-store';
import { QrCheckInModal } from './components/qr-check-in-modal';

export default function CheckInView() {
  const router = useRouter();
  const { roomData, currentUser, openAuthModal, loadData, showToast } = useApp();

  return (
    <QrCheckInModal
      seats={roomData.seats}
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

