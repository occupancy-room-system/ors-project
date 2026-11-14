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
import { Badge } from '@/components/ui/badge';
import { getInitials } from '@/lib/utils';
import { Seat } from '@/types';
import { formatLabHour } from '@/utils/lab-hours';

export default function HomePage() {
  const router = useRouter();
  const { roomData, backendOnline, loadData, currentUser, openAuthModal, openUserDetailModal, labConfig } = useApp();
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

      {/* Top Header Row: User Account, Breadcrumbs & Room Title */}
      <div className="space-y-1">
        {/* Top Left: User Account & Breadcrumbs */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            {currentUser && (
              <button
                type="button"
                onClick={openUserDetailModal}
                className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full border border-border/80 bg-background hover:bg-muted/60 transition-colors shadow-2xs group text-left cursor-pointer"
                title="Click to view and edit user information"
              >
                <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-[9px] font-bold flex items-center justify-center">
                  {getInitials(currentUser.fullName || currentUser.username)}
                </div>
                <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                  {currentUser.fullName || currentUser.username}
                </span>
                <Badge
                  variant="secondary"
                  className="text-[9px] font-bold px-1.5 py-0 h-4 leading-none"
                >
                  {currentUser.role}
                </Badge>
                <span className="text-[10px] text-muted-foreground hidden sm:inline">
                  · Edit Details
                </span>
              </button>
            )}

            <div className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
              <span>Spaces</span>
              <span className="text-muted-foreground/60">&gt;</span>
              <span>Turing Hall</span>
            </div>
          </div>
        </div>

        {/* Room Title + Status Badge */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-0.5">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Turing Hall 101
            </h1>
            <Badge
              variant="outline"
              className={`px-2 py-0.5 text-[10px] font-bold rounded-md tracking-wider uppercase ${
                !labConfig.workstationsEnabled
                  ? 'border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300'
                  : 'border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
              }`}
            >
              {!labConfig.workstationsEnabled
                ? 'Workstations Disabled'
                : `SE Lab hours ${formatLabHour(labConfig.openHour)}–${formatLabHour(labConfig.closeHour)}`}
            </Badge>
          </div>

          <div className="flex items-center gap-4 self-start sm:self-auto">
            <span className="text-xs text-muted-foreground font-medium hidden md:inline-block">
              Software Engineering Innovation Lab
            </span>
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
