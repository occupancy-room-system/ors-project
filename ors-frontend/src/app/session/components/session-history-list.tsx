'use client';

import React from 'react';
import { OccupancySession } from '@/types';

interface SessionHistoryListProps {
  history: OccupancySession[];
}

export function SessionHistoryList({ history }: SessionHistoryListProps) {
  if (history.length === 0) return null;

  return (
    <div className="max-w-xl mx-auto bg-white rounded-xl border border-slate-200 shadow-xs p-6">
      <h3 className="text-sm font-bold text-slate-900 mb-3">Your Previous Lab Sessions</h3>
      <div className="space-y-2.5">
        {history.map((hist) => (
          <div
            key={hist.id}
            className="p-3 rounded-lg border border-slate-100 bg-slate-50/70 flex items-center justify-between text-xs"
          >
            <div>
              <span className="font-bold text-slate-800">{hist.seatCode}</span>
              <span className="text-slate-500 ml-2">({hist.roomName})</span>
              <span className="text-[11px] text-slate-400 block font-mono">
                {new Date(hist.checkedInAt).toLocaleDateString()} at{' '}
                {new Date(hist.checkedInAt).toLocaleTimeString()}
              </span>
            </div>
            <div className="text-right">
              <span className="font-mono font-medium text-slate-700">{hist.durationMinutes} mins</span>
              <span
                className={`block text-[10px] font-semibold ${
                  hist.status === 'CHECKED_OUT' ? 'text-emerald-600' : 'text-slate-500'
                }`}
              >
                {hist.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

