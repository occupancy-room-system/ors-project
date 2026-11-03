'use client';

import React, { useMemo, useState } from 'react';
import { OccupancySession } from '@/types';
import { Clock, CheckCircle2 } from 'lucide-react';
import { TablePagination } from '@/components/ui/table-pagination';

interface SessionHistoryListProps {
  history: OccupancySession[];
}

export function SessionHistoryList({ history }: SessionHistoryListProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const displaySessions = useMemo(() => {
    if (!history || history.length === 0) return [];
    return history.map((item) => {
      const d = new Date(item.checkedInAt);
      const code = item.seatCode.replace(/^SEAT-/, '');
      return {
        id: item.id,
        dateFormatted: d.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
        deskCode: code,
        durationText: `${item.durationMinutes || 60} minutes`,
        status: 'Completed',
      };
    });
  }, [history]);

  const paginatedSessions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return displaySessions.slice(start, start + pageSize);
  }, [displaySessions, currentPage, pageSize]);

  return (
    <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-card shadow-2xs overflow-hidden">
      {/* Card Header */}
      <div className="p-5 sm:px-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-foreground">
            Previous lab sessions
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Completed visits to SE Lab
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
          <Clock className="w-3.5 h-3.5" />
          <span>{displaySessions.length} completed sessions</span>
        </div>
      </div>

      {/* Sessions Table or Empty State */}
      {displaySessions.length > 0 ? (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-100 dark:border-slate-800 text-[11px] text-muted-foreground font-semibold uppercase tracking-wider bg-slate-50/50 dark:bg-slate-900/40">
                <tr>
                  <th className="py-3 px-6">Date</th>
                  <th className="py-3 px-6">Desk</th>
                  <th className="py-3 px-6">Duration</th>
                  <th className="py-3 px-6">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {paginatedSessions.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors"
                  >
                    <td className="py-3.5 px-6 font-medium text-foreground">
                      {item.dateFormatted}
                    </td>
                    <td className="py-3.5 px-6 font-bold text-foreground">
                      {item.deskCode}
                    </td>
                    <td className="py-3.5 px-6 text-muted-foreground">
                      {item.durationText}
                    </td>
                    <td className="py-3.5 px-6">
                      <div className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>Completed</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <TablePagination
            currentPage={currentPage}
            totalItems={displaySessions.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            pageSizeOptions={[5, 10, 25, 50, 100, 150]}
          />
        </>
      ) : (
        <div className="py-10 text-center text-xs text-muted-foreground space-y-1">
          <p className="font-semibold text-foreground">No completed lab visits yet</p>
          <p>Your session history will appear here once you complete a workstation session.</p>
        </div>
      )}
    </div>
  );
}
