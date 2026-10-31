'use client';

import React from 'react';
import { useApp } from '@/hooks/use-app-store';
import { useActions } from '@/hooks/use-actions';
import { ActiveSessionCard } from './components/active-session-card';
import { SessionHistoryList } from './components/session-history-list';

export default function SessionView() {
  const { activeSession, sessionHistory, actionLoading } = useApp();
  const { handleCheckOut } = useActions();

  return (
    <div className="space-y-6">
      <ActiveSessionCard
        session={activeSession}
        onCheckOut={handleCheckOut}
        isLoading={actionLoading}
      />
      <SessionHistoryList history={sessionHistory} />
    </div>
  );
}

