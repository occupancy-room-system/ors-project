'use client';

import React from 'react';
import { OccupancySession } from '@/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, History, Calendar } from 'lucide-react';

interface SessionHistoryListProps {
  history: OccupancySession[];
}

export function SessionHistoryList({ history }: SessionHistoryListProps) {
  if (history.length === 0) return null;

  return (
    <Card className="max-w-xl mx-auto border-border shadow-xs">
      <CardHeader className="p-5 pb-3 border-b border-border/60">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-primary" />
          <CardTitle className="text-sm font-bold">Previous Workstation Sessions</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-5 space-y-2.5">
        {history.map((hist) => (
          <div
            key={hist.id}
            className="p-3 rounded-xl border border-border/70 bg-muted/30 flex items-center justify-between text-xs hover:border-border transition-colors"
          >
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-foreground">{hist.seatCode}</span>
                <span className="text-muted-foreground text-[11px]">({hist.roomName})</span>
              </div>
              <div className="text-[11px] text-muted-foreground flex items-center gap-1 font-mono">
                <Calendar className="w-3 h-3 text-muted-foreground" />
                {new Date(hist.checkedInAt).toLocaleDateString()} at{' '}
                {new Date(hist.checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>

            <div className="text-right space-y-1">
              <div className="font-mono font-bold text-foreground">{hist.durationMinutes} mins</div>
              <Badge
                variant="outline"
                className={`text-[9px] font-bold ${
                  hist.status === 'CHECKED_OUT'
                    ? 'border-emerald-300 text-emerald-700 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-300'
                    : 'text-muted-foreground'
                }`}
              >
                {hist.status}
              </Badge>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

