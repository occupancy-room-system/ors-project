'use client';

import React from 'react';
import { useApp } from '@/hooks/use-app-store';

export function UserProfile() {
  const { currentUser, openAuthModal, setCurrentUser, showToast } = useApp();

  const handleLogout = () => {
    setCurrentUser(null);
    showToast('Signed out of laboratory session.', 'info');
  };

  return (
    <div className="flex items-center gap-2 shrink-0">
      {currentUser ? (
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={() => openAuthModal('student')}
            title="Switch account"
            className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl border border-slate-200 transition-colors cursor-pointer"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                currentUser.role === 'ADMINISTRATOR' ? 'bg-amber-500' : 'bg-blue-500'
              }`}
            />
            <span className="font-bold truncate max-w-[90px] sm:max-w-none">
              {currentUser.fullName}
            </span>
            <span className="hidden sm:inline text-slate-400 font-normal">
              ({currentUser.role === 'ADMINISTRATOR' ? 'Admin' : 'Student'})
            </span>
          </button>
          <button
            onClick={handleLogout}
            title="Sign out"
            className="p-1.5 text-xs text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
          >
            <span className="hidden sm:inline">Logout</span>
            <span className="sm:hidden text-sm">🚪</span>
          </button>
        </div>
      ) : (
        <button
          onClick={() => openAuthModal('student')}
          className="px-3.5 py-1.5 sm:px-4 sm:py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors cursor-pointer"
        >
          Sign In
        </button>
      )}
    </div>
  );
}

