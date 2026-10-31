'use client';

import React from 'react';

interface OfflineBannerProps {
  onRetry: () => void;
}

export function OfflineBanner({ onRetry }: OfflineBannerProps) {
  return (
    <div className="text-xs font-medium text-amber-800 bg-amber-50 border border-amber-200/80 px-3.5 py-2 rounded-xl flex items-center justify-between gap-3 shadow-2xs">
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping shrink-0" />
        <span>
          ORS Backend (<code className="font-mono font-bold text-[11px]">localhost:8080</code>) is starting or offline. Showing local SE Lab 101 layout.
        </span>
      </div>
      <button
        onClick={onRetry}
        className="text-xs font-bold text-amber-900 underline hover:no-underline cursor-pointer shrink-0"
      >
        Retry Connection
      </button>
    </div>
  );
}

