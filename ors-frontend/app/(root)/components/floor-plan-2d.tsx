'use client';

import React, { useState } from 'react';
import { Seat, Room } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Monitor, Users, Layers, Info } from 'lucide-react';

interface FloorPlan2DProps {
  room: Room;
  seats: Seat[];
  selectedSeat: Seat | null;
  onSelectSeat: (seat: Seat) => void;
}

export function FloorPlan2D({
  room,
  seats,
  selectedSeat,
  onSelectSeat,
}: FloorPlan2DProps) {
  const [filterMode, setFilterMode] = useState<'ALL' | 'INDIVIDUAL' | 'GROUP'>('ALL');

  const getSeatColor = (status: Seat['status']) => {
    switch (status) {
      case 'AVAILABLE':
        return {
          bg: 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border-emerald-500/40',
          dot: 'bg-emerald-500',
          label: 'Free',
        };
      case 'OCCUPIED':
        return {
          bg: 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-800 dark:text-rose-300 border-rose-500/40',
          dot: 'bg-rose-500',
          label: 'Occupied',
        };
      case 'RESERVED':
        return {
          bg: 'bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-800 dark:text-indigo-300 border-indigo-500/40',
          dot: 'bg-indigo-500',
          label: 'Reserved',
        };
      case 'EXPIRING_SOON':
        return {
          bg: 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-amber-300 border-amber-500/40',
          dot: 'bg-amber-500',
          label: 'Expiring',
        };
      case 'MAINTENANCE':
        return {
          bg: 'bg-muted/80 text-muted-foreground border-border/80',
          dot: 'bg-muted-foreground',
          label: 'Repair',
        };
      default:
        return {
          bg: 'bg-muted text-muted-foreground border-border',
          dot: 'bg-muted-foreground',
          label: 'Unknown',
        };
    }
  };

  // Group stations
  const pods = [
    { title: 'Station A', type: 'INDIVIDUAL', seats: seats.filter((s) => s.podLabel === 'Station A') },
    { title: 'Station B', type: 'INDIVIDUAL', seats: seats.filter((s) => s.podLabel === 'Station B') },
    { title: 'Station C', type: 'INDIVIDUAL', seats: seats.filter((s) => s.podLabel === 'Station C') },
    { title: 'Station D', type: 'INDIVIDUAL', seats: seats.filter((s) => s.podLabel === 'Station D') },
    { title: 'Station E', type: 'INDIVIDUAL', seats: seats.filter((s) => s.podLabel === 'Station E') },
    { title: 'Group Table 1', type: 'GROUP', seats: seats.filter((s) => s.podLabel === 'Group Table 1' || s.groupTableId === 1) },
    { title: 'Group Table 2', type: 'GROUP', seats: seats.filter((s) => s.podLabel === 'Group Table 2' || s.groupTableId === 2) },
    { title: 'Group Table 3', type: 'GROUP', seats: seats.filter((s) => s.podLabel === 'Group Table 3' || s.groupTableId === 3) },
    { title: 'Group Table 4', type: 'GROUP', seats: seats.filter((s) => s.podLabel === 'Group Table 4' || s.groupTableId === 4) },
    { title: 'Group Table 5', type: 'GROUP', seats: seats.filter((s) => s.podLabel === 'Group Table 5' || s.groupTableId === 5) },
  ];

  const filteredPods = pods.filter((p) => {
    if (filterMode === 'ALL') return true;
    return p.type === filterMode;
  });

  return (
    <div className="bg-card rounded-2xl border border-border/80 shadow-xs p-5 sm:p-6 space-y-6">
      {/* Header controls & filter tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/60">
        <div>
          <h3 className="text-base font-bold text-foreground tracking-tight">Interactive Workstation Map</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Select an available desk to reserve or view current session occupancy.
          </p>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1.5 p-1 bg-muted/60 rounded-xl border border-border/60 self-start sm:self-auto">
          <Button
            variant={filterMode === 'ALL' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setFilterMode('ALL')}
            className="h-7 text-xs font-semibold px-3"
          >
            All Workstations
          </Button>
          <Button
            variant={filterMode === 'INDIVIDUAL' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setFilterMode('INDIVIDUAL')}
            className="h-7 text-xs font-semibold px-3 gap-1.5"
          >
            <Monitor className="w-3.5 h-3.5" />
            Individual Desks
          </Button>
          <Button
            variant={filterMode === 'GROUP' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setFilterMode('GROUP')}
            className="h-7 text-xs font-semibold px-3 gap-1.5"
          >
            <Users className="w-3.5 h-3.5" />
            Group Pods
          </Button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-muted-foreground bg-muted/30 p-3 rounded-xl border border-border/40">
        <span className="text-[11px] font-bold uppercase tracking-wider text-foreground">Legend:</span>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span>Available</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
          <span>Occupied</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
          <span>Reserved</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          <span>Expiring Soon (&lt;10m)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-muted-foreground" />
          <span>Maintenance</span>
        </div>
      </div>

      {/* Pods Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredPods.map((pod) => {
          const availableInPod = pod.seats.filter((s) => s.status === 'AVAILABLE').length;

          return (
            <div
              key={pod.title}
              className="p-4 rounded-xl border border-border/70 bg-card hover:border-border transition-all space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {pod.type === 'INDIVIDUAL' ? (
                    <Monitor className="w-4 h-4 text-primary" />
                  ) : (
                    <Users className="w-4 h-4 text-indigo-500" />
                  )}
                  <span className="font-bold text-xs text-foreground">{pod.title}</span>
                </div>
                <Badge
                  variant="outline"
                  className={`text-[10px] font-bold ${
                    availableInPod > 0 ? 'border-emerald-300 text-emerald-700 dark:text-emerald-400' : 'text-muted-foreground'
                  }`}
                >
                  {availableInPod} / {pod.seats.length} Free
                </Badge>
              </div>

              {/* Seats inside this pod */}
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 pt-1">
                {pod.seats.map((seat) => {
                  const style = getSeatColor(seat.status);
                  const isSelected = selectedSeat?.id === seat.id;

                  return (
                    <button
                      key={seat.id}
                      type="button"
                      onClick={() => onSelectSeat(seat)}
                      className={`p-2 rounded-lg border text-center transition-all cursor-pointer relative group flex flex-col items-center justify-center gap-1 ${
                        style.bg
                      } ${isSelected ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                    >
                      <span className={`w-2 h-2 rounded-full ${style.dot}`} />
                      <span className="font-mono text-[11px] font-bold leading-none">{seat.seatCode.replace('SEAT-', '')}</span>
                      <span className="text-[9px] font-medium opacity-80 leading-none">{style.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

