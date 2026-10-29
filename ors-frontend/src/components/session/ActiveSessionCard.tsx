import React, { useEffect, useState } from 'react';
import { OccupancySession } from '../../types';

interface ActiveSessionCardProps {
  session: OccupancySession | null;
  onCheckOut: (sessionId: number) => void;
  isLoading?: boolean;
}

export const ActiveSessionCard: React.FC<ActiveSessionCardProps> = ({
  session,
  onCheckOut,
  isLoading = false,
}) => {
  const [secondsLeft, setSecondsLeft] = useState<number>(0);

  useEffect(() => {
    if (!session) return;

    const calculateRemaining = () => {
      const expiry = new Date(session.expiresAt).getTime();
      const diff = Math.max(0, Math.floor((expiry - Date.now()) / 1000));
      setSecondsLeft(diff);
    };

    calculateRemaining();
    const interval = setInterval(calculateRemaining, 1000);
    return () => clearInterval(interval);
  }, [session]);

  if (!session) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center max-w-xl mx-auto shadow-sm space-y-4">
        <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto font-extrabold text-xl shadow-2xs">
          SE
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900">No Active Workstation Session</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
            You do not currently have an active laboratory session. View the 2D floor plan to reserve an available desk, or scan a desk QR code at Turing Hall 101 to check in.
          </p>
        </div>
      </div>
    );
  }

  const hours = Math.floor(secondsLeft / 3600);
  const minutes = Math.floor((secondsLeft % 3600) / 60);
  const seconds = secondsLeft % 60;
  const isExpiringSoon = secondsLeft <= 10 * 60; // 10-minute warning threshold

  // Calculate percentage of time elapsed
  const totalSeconds = session.durationMinutes ? session.durationMinutes * 60 : 7200;
  const elapsedSeconds = Math.max(0, totalSeconds - secondsLeft);
  const percentElapsed = Math.min(100, Math.round((elapsedSeconds / totalSeconds) * 100));

  return (
    <div className="max-w-xl mx-auto space-y-4">
      {/* 10-Minute Expiry Reminder Banner */}
      {isExpiringSoon && secondsLeft > 0 && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 flex items-start gap-3 shadow-xs animate-in fade-in">
          <span className="text-xl">⚠️</span>
          <div>
            <h4 className="font-bold text-sm">Session Expiring in Under 10 Minutes</h4>
            <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
              Your scheduled laboratory session is concluding. Please save your code, commit to git, clean your desk area, and check out before leaving.
            </p>
          </div>
        </div>
      )}

      {/* Main Active Session Card */}
      <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-2xs p-4 sm:p-8 overflow-hidden">
        <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-slate-100">
          <div>
            <span className="text-[10px] sm:text-xs font-bold text-blue-600 uppercase tracking-wider">{session.podLabel}</span>
            <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900">Workstation {session.seatCode}</h3>
            <span className="text-xs text-slate-500">{session.roomName}</span>
          </div>
          <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="hidden xs:inline">Active</span> Session
          </span>
        </div>

        {/* Big Tabular Countdown Display for Available Time */}
        <div className="py-6 sm:py-8 px-2 text-center bg-slate-50/70 rounded-xl my-3 sm:my-4 border border-slate-100">
          <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider block">
            Your Available Session Time Remaining
          </span>
          <div className={`text-3xl xs:text-4xl sm:text-6xl font-mono font-extrabold tracking-tight my-2 tabular-nums ${
            isExpiringSoon ? 'text-amber-600 animate-pulse' : 'text-slate-900'
          }`}>
            {String(hours).padStart(2, '0')}:{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Total Allocated Duration: <strong>{session.durationMinutes ? `${Math.round(session.durationMinutes / 60)} Hours (${session.durationMinutes} mins)` : '2 Hours'}</strong>
          </p>

          {/* Progress Bar */}
          <div className="mt-4 max-w-xs mx-auto">
            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full transition-all duration-1000 ${
                  isExpiringSoon ? 'bg-amber-500' : 'bg-blue-600'
                }`}
                style={{ width: `${percentElapsed}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
              <span>Started</span>
              <span>{percentElapsed}% Elapsed</span>
              <span>Expiry</span>
            </div>
          </div>
        </div>

        {/* Timestamps Grid */}
        <div className="grid grid-cols-2 gap-3 py-3 border-t border-slate-100 text-xs">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/70">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Checked In At:</span>
            <span className="font-bold text-slate-800 font-mono tabular-nums text-xs">
              {new Date(session.checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/70">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Scheduled Expiry:</span>
            <span className="font-bold text-slate-800 font-mono tabular-nums text-xs">
              {new Date(session.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>

        {/* Checkout Button */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500 text-center sm:text-left">
            Finished coding? Release your workstation so other engineering students can check in.
          </div>
          <button
            onClick={() => onCheckOut(session.id)}
            disabled={isLoading}
            className="w-full sm:w-auto px-5 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors cursor-pointer shrink-0 disabled:opacity-50"
          >
            {isLoading ? 'Checking Out...' : 'Check Out Workstation'}
          </button>
        </div>
      </div>
    </div>
  );
};
