import React from 'react';
import { SeatStatus } from '@/types';

interface SeatStatusBadgeProps {
  status: SeatStatus;
  className?: string;
}

const statusConfig: Record<SeatStatus, { label: string; bg: string; text: string; dot: string }> = {
  AVAILABLE: {
    label: 'Available',
    bg: 'bg-emerald-50 border-emerald-200/80',
    text: 'text-emerald-700',
    dot: 'bg-emerald-500',
  },
  OCCUPIED: {
    label: 'In Use',
    bg: 'bg-rose-50 border-rose-200/80',
    text: 'text-rose-700',
    dot: 'bg-rose-500',
  },
  RESERVED: {
    label: 'Reserved',
    bg: 'bg-indigo-50 border-indigo-200/80',
    text: 'text-indigo-700',
    dot: 'bg-indigo-500',
  },
  EXPIRING_SOON: {
    label: 'Expiring Soon',
    bg: 'bg-amber-50 border-amber-200/80',
    text: 'text-amber-800',
    dot: 'bg-amber-500',
  },
  MAINTENANCE: {
    label: 'Maintenance',
    bg: 'bg-slate-100 border-slate-300',
    text: 'text-slate-600',
    dot: 'bg-slate-400',
  },
};

export const SeatStatusBadge: React.FC<SeatStatusBadgeProps> = ({ status, className = '' }) => {
  const cfg = statusConfig[status] || statusConfig.AVAILABLE;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-bold border ${cfg.bg} ${cfg.text} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      <span>{cfg.label}</span>
    </span>
  );
};

