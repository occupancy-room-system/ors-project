'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/config/routes';
import { useApp } from '@/hooks/use-app-store';
import { useActions } from '@/hooks/use-actions';
import { LabStatsBanner } from './components/lab-stats-banner';
import { FloorPlan2D } from './components/floor-plan-2d';
import { SeatDetailDialog } from './components/seat-detail-dialog';
import { OfflineBanner } from '@/components/offline-banner';
import { Seat } from '@/types';

export default function HomePage() {
  const router = useRouter();
  const { roomData, backendOnline, loadData, currentUser, openAuthModal } = useApp();
  const { handleConfirmReservation, handleToggleMaintenance } = useActions();
  const [selectedSeat, setSelectedSeat] = useState<Seat | null>(null);

  return (
    <div className="space-y-6">
      {!backendOnline && <OfflineBanner onRetry={loadData} />}

      <LabStatsBanner />

      <FloorPlan2D
        room={roomData.room}
        seats={roomData.seats}
        selectedSeat={selectedSeat}
        onSelectSeat={setSelectedSeat}
      />

      {selectedSeat && (
        <SeatDetailDialog
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
