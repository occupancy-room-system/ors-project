'use client';

import React, { useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '@/hooks/use-app-store';
import { useActions } from '@/hooks/use-actions';
import { ActiveSessionCard } from './components/active-session-card';
import { SessionHistoryList } from './components/session-history-list';
import { ROUTES } from '@/config/routes';
import {
  ChevronRight,
  Map,
  ArrowUpRight,
  Check,
  HelpCircle,
} from 'lucide-react';

export default function SessionPage() {
  const router = useRouter();
  const { activeSession, sessionHistory, actionLoading, currentUser } = useApp();
  const { handleCheckOut } = useActions();

  // For Admin user, strictly redirect to Admin Dashboard
  useEffect(() => {
    if (currentUser?.role === 'ADMINISTRATOR' || currentUser?.role === 'ROLE_ADMIN') {
      router.replace(ROUTES.ADMIN);
    }
  }, [currentUser, router]);

  if (currentUser?.role === 'ADMINISTRATOR' || currentUser?.role === 'ROLE_ADMIN') {
    return null;
  }

  // Use only the actual active session (no hardcoded fallback)
  const currentSession = activeSession;

  const onSessionEnd = async (sessionId: number) => {
    await handleCheckOut(sessionId);
  };

  // Formatted date time for stepper right label
  const stepperTimestamp = useMemo(() => {
    const now = new Date();
    return `Today, ${now.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })} · ${now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
  }, []);

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* 1. Breadcrumb navigation */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground select-none">
        <span>Spaces</span>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-foreground font-medium">SE Lab</span>
      </div>

      {/* 2. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            My session
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Your current workspace and previous lab visits, all in one place.
          </p>
        </div>

        <Link
          href={ROUTES.HOME}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors shrink-0"
        >
          <Map className="w-3.5 h-3.5" />
          <span>View floor plan</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* 3. Stepper Bar */}
      <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-card p-4 sm:px-6 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-4 text-xs font-medium">
          {/* Step 1: Reservation */}
          <div className="flex items-center gap-2">
            {currentSession ? (
              <div className="w-5 h-5 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-[10px] font-bold">
                <Check className="w-3 h-3 stroke-[3]" />
              </div>
            ) : (
              <div className="w-5 h-5 rounded-full border border-slate-300 dark:border-slate-700 text-slate-400 flex items-center justify-center text-[11px] font-medium">
                1
              </div>
            )}
            <span className={currentSession ? 'font-medium text-slate-700 dark:text-slate-300' : 'text-slate-400 dark:text-slate-500'}>
              Reservation
            </span>
          </div>

          <div className="w-5 sm:w-12 h-[1px] bg-slate-200 dark:bg-slate-700" />

          {/* Step 2: Check in */}
          <div className="flex items-center gap-2">
            {currentSession ? (
              <div className="w-5 h-5 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-[10px] font-bold">
                <Check className="w-3 h-3 stroke-[3]" />
              </div>
            ) : (
              <div className="w-5 h-5 rounded-full border border-slate-300 dark:border-slate-700 text-slate-400 flex items-center justify-center text-[11px] font-medium">
                2
              </div>
            )}
            <span className={currentSession ? 'font-medium text-slate-700 dark:text-slate-300' : 'text-slate-400 dark:text-slate-500'}>
              Check in
            </span>
          </div>

          <div className="w-5 sm:w-12 h-[1px] bg-slate-200 dark:bg-slate-700" />

          {/* Step 3: Active session */}
          <div className="flex items-center gap-2">
            {currentSession ? (
              <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[11px] font-bold shadow-xs">
                3
              </div>
            ) : (
              <div className="w-5 h-5 rounded-full border border-slate-300 dark:border-slate-700 text-slate-400 flex items-center justify-center text-[11px] font-medium">
                3
              </div>
            )}
            <span className={currentSession ? 'font-bold text-foreground' : 'text-slate-400 dark:text-slate-500'}>
              Active session
            </span>
          </div>
        </div>

        {/* Right Label */}
        <div className="text-xs text-muted-foreground font-normal">
          {currentSession ? stepperTimestamp : 'No active session right now.'}
        </div>
      </div>

      {/* 4. Active Session Card */}
      <ActiveSessionCard
        session={currentSession}
        onCheckOut={onSessionEnd}
        isLoading={actionLoading}
      />

      {/* 5. Previous Lab Sessions Card */}
      <SessionHistoryList history={sessionHistory} />

      {/* 6. Page Footer */}
      <div className="pt-8 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-muted-foreground">
        <div>SE Lab · Ground floor</div>
        <div className="flex items-center gap-1.5 cursor-pointer hover:text-foreground">
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Need help? Contact lab support</span>
        </div>
      </div>
    </div>
  );
}
