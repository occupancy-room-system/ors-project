'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/config';
import { useApp } from '@/hooks/use-app-store';
import { useActions } from '@/hooks/use-actions';
import { AdminDashboard } from './components/admin-dashboard';

export default function AdminView() {
  const router = useRouter();
  const { currentUser, roomData, loadData, openAuthModal } = useApp();
  const { handleToggleMaintenance, handleTerminateSession } = useActions();

  if (currentUser?.role !== 'ADMINISTRATOR') {
    return (
      <div className="max-w-md mx-auto my-8 sm:my-14 p-6 sm:p-8 bg-white rounded-3xl border border-slate-200 shadow-xl text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 flex items-center justify-center text-3xl shadow-xs">
          🛡️
        </div>
        <span className="inline-block text-[11px] font-bold text-amber-700 uppercase tracking-wider bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
          Staff Restricted Area
        </span>
        <h2 className="text-xl font-extrabold text-slate-900 mt-3 mb-2 tracking-tight">Admin Console Portal</h2>
        <p className="text-xs text-slate-600 leading-relaxed mb-6">
          The Laboratory Administration Console is strictly restricted to University Lab Technicians and Faculty Administrators.
        </p>

        {currentUser ? (
          <div className="p-3.5 mb-6 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-left">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Current Account</span>
            <div className="flex items-center justify-between mt-1">
              <span className="font-bold text-slate-800">{currentUser.fullName}</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-100 text-blue-800 font-bold">{currentUser.role}</span>
            </div>
            <p className="text-[11px] text-rose-600 mt-2 font-medium">⚠️ Your student account does not have administrator privileges.</p>
          </div>
        ) : (
          <div className="p-3.5 mb-6 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 text-left">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Status</span>
            <p className="mt-1">You are browsing in <strong>Guest (View-Only)</strong> mode.</p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-2.5 justify-center">
          <button
            onClick={() => openAuthModal('admin')}
            className="px-4 py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
          >
            <span>🔑</span>
            <span>Sign In to Admin Portal</span>
          </button>
          <button
            onClick={() => router.push(ROUTES.HOME)}
            className="px-4 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            Return to Floor Plan
          </button>
        </div>
      </div>
    );
  }

  return (
    <AdminDashboard
      roomData={roomData}
      onRefresh={loadData}
      onToggleSeatMaintenance={handleToggleMaintenance}
      onTerminateSession={handleTerminateSession}
    />
  );
}

