'use client';

import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface OfflineBannerProps {
  onRetry?: () => void;
}

export function OfflineBanner({ onRetry }: OfflineBannerProps) {
  return (
    <Alert className="border-amber-300/80 bg-amber-50/70 dark:bg-amber-950/30 text-amber-950 dark:text-amber-200 shadow-xs">
      <div className="flex items-start justify-between gap-4 w-full">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <AlertTitle className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
              Backend Offline Mode (Cached Data)
            </AlertTitle>
            <AlertDescription className="text-xs text-amber-900/80 dark:text-amber-400/90 mt-0.5">
              The laboratory server at port 3001 is currently unreachable. You are viewing cached floor plan layouts.
            </AlertDescription>
          </div>
        </div>
        {onRetry && (
          <Button
            size="sm"
            variant="outline"
            onClick={onRetry}
            className="h-8 text-xs font-semibold gap-1.5 shrink-0 bg-background/80 border-amber-300 text-amber-900 hover:bg-amber-100"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reconnect
          </Button>
        )}
      </div>
    </Alert>
  );
}

