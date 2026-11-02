'use client';

import React from 'react';
import { useApp } from '@/hooks/use-app-store';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export function ToastContainer() {
  const { toast, dismissToast } = useApp();

  if (!toast) return null;

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />,
    info: <Info className="w-5 h-5 text-blue-500 shrink-0" />,
  };

  const bgStyles = {
    success: 'bg-emerald-50/95 border-emerald-200 text-emerald-950 dark:bg-emerald-950/80 dark:border-emerald-800 dark:text-emerald-100',
    error: 'bg-rose-50/95 border-rose-200 text-rose-950 dark:bg-rose-950/80 dark:border-rose-800 dark:text-rose-100',
    info: 'bg-card/95 border-border text-foreground',
  };

  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 sm:right-6 z-50 max-w-sm w-full animate-in fade-in slide-in-from-bottom-5 duration-200">
      <div
        className={`flex items-start gap-3 p-4 rounded-xl border shadow-lg backdrop-blur-md transition-all ${bgStyles[toast.type]}`}
      >
        {icons[toast.type]}
        <div className="flex-1 text-sm font-medium leading-snug">{toast.text}</div>
        <button
          onClick={dismissToast}
          className="text-muted-foreground hover:text-foreground transition-colors p-0.5 rounded-md"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

