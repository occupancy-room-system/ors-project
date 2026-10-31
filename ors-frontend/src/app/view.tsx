'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/config';
import { useApp } from '@/hooks/use-app-store';
import { useActions } from '@/hooks/use-actions';
import { RoomMap2D } from './components/room-map-2d';
import { SeatDetailModal } from './components/seat-detail-modal';
import { LabBanner } from './components/lab-banner';
import { OfflineBanner } from '@/components/offline-banner';
import { Seat } from '@/types';

export default function HomeView() {
  const router = useRouter();
  const { roomData, backendOnline, loadData, currentUser, openAuthModal } = useApp();
  const { handleConfirmReservation, handleToggleMaintenance } = useActions();
  const [selectedSeat, setSelectedSeat] = useState<Seat | null>(null);

  return (
    <div className="space-y-4 sm:space-y-6">
      {!backendOnline && <OfflineBanner onRetry={loadData} />}

      <LabBanner />

      <RoomMap2D
        room={roomData.room}
        seats={roomData.seats}
        selectedSeat={selectedSeat}
        onSelectSeat={setSelectedSeat}
        onScanQR={setSelectedSeat}
      />

      {selectedSeat && (
        <SeatDetailModal
          seat={selectedSeat}
          onClose={() => setSelectedSeat(null)}
          currentUser={currentUser}
          onOpenLogin={() => openAuthModal('student')}
          onConfirmReservation={async (params) => {
            await handleConfirmReservation(params);
          }}
          onToggleMaintenance={handleToggleMaintenance}
          onNavigateToCheckIn={() => router.push(ROUTES.CHECKIN)}
        />
      )}
    </div>
  );
}

