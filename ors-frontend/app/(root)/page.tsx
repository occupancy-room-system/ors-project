'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/config/routes';
import { useApp } from '@/hooks/use-app-store';
import { useActions } from '@/hooks/use-actions';
import { LabStatsBanner } from './components/lab-stats-banner';
import { FloorPlan2D } from './components/floor-plan-2d';
import { SeatDetailDialog } from './components/seat-detail-dialog';
import { OfflineBanner } from '@/components/offline-banner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { QrCode } from 'lucide-react';
import { Seat } from '@/types';

export default function HomePage() {
  const router = useRouter();
  const { roomData, backendOnline, loadData, currentUser, openAuthModal } = useApp();
  const { handleConfirmReservation, handleToggleMaintenance } = useActions();
  const [selectedSeat, setSelectedSeat] = useState<Seat | null>(null);

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
    <div className="space-y-4 sm:space-y-5 pb-8">
      {!backendOnline && <OfflineBanner onRetry={loadData} />}

      {/* Top Header Row: Breadcrumbs & Room Title */}
      <div className="space-y-1">
        {/* Breadcrumb */}
        <div className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
          <span>Spaces</span>
          <span className="text-muted-foreground/60">&gt;</span>
          <span>Turing Hall</span>
        </div>

        {/* Room Title + Status Badge & QR Action Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-0.5">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Turing Hall 101
            </h1>
            <Badge
              variant="outline"
              className="px-2 py-0.5 text-[10px] font-bold border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded-md tracking-wider uppercase"
            >
              SE Lab hours 09:00–17:00
            </Badge>
          </div>

          <div className="flex items-center gap-4 self-start sm:self-auto">
            <span className="text-xs text-muted-foreground font-medium hidden md:inline-block">
              Software Engineering Innovation Lab
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(ROUTES.CHECKIN)}
              className="gap-1.5 h-8 px-3 text-xs font-semibold rounded-lg border-border hover:bg-muted/60 cursor-pointer shadow-2xs"
            >
              <QrCode className="w-3.5 h-3.5" />
              Scan desk QR
            </Button>
          </div>
        </div>
      </div>

      {/* Lab Stats Summary Card */}
      <LabStatsBanner />

      {/* Interactive 2D Floor Plan */}
      <FloorPlan2D
        room={roomData.room}
        seats={roomData.seats}
        selectedSeat={selectedSeat}
        onSelectSeat={setSelectedSeat}
      />

      {/* Seat Detail / Reservation Dialog */}
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
