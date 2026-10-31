'use client';

import React from 'react';
import { useApp } from '@/hooks/use-app-store';

export function Toast() {
  const { toast, dismissToast } = useApp();
  if (!toast) return null;

  const colourMap = {
    success: 'bg-emerald-950 text-emerald-100 border-emerald-800',
    error: 'bg-rose-950 text-rose-100 border-rose-800',
    info: 'bg-slate-900 text-white border-slate-700',
  };

  return (
    <div className="fixed bottom-20 sm:bottom-6 right-3 sm:right-6 left-3 sm:left-auto z-50 animate-in fade-in slide-in-from-bottom-4 duration-200">
      <div
        className={`px-4 py-3 rounded-xl shadow-xl text-xs font-medium border flex items-center gap-2 max-w-sm ${colourMap[toast.type]}`}
      >
        <span>{toast.text}</span>
        <button
          onClick={dismissToast}
          className="ml-auto text-white/70 hover:text-white p-1 cursor-pointer"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

