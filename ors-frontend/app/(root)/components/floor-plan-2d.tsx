'use client';

import React, { useState, useMemo } from 'react';
import { Seat, Room } from '@/types';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import {
  Layers,
  Search,
  User as UserIcon,
  Bookmark,
  Clock,
  Wrench,
  Check,
  Maximize2,
  Minimize2,
  SlidersHorizontal,
  ChevronDown,
  ArrowUp,
} from 'lucide-react';

interface FloorPlan2DProps {
  room: Room;
  seats: Seat[];
  selectedSeat: Seat | null;
  onSelectSeat: (seat: Seat) => void;
  isAdminMode?: boolean;
}

export function FloorPlan2D({
  room,
  seats,
  selectedSeat,
  onSelectSeat,
  isAdminMode = false,
}: FloorPlan2DProps) {
  const [filterMode, setFilterMode] = useState<'ALL' | 'INDIVIDUAL' | 'GROUP'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'EXPIRING_SOON' | 'MAINTENANCE'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [zoomLevel, setZoomLevel] = useState(100);

  // Helper to extract natural sorting number from seat code (e.g. 'SEAT-A7' -> 7, 'SEAT-GT1-2' -> 2)
  const extractSeatNumber = (seatCode: string) => {
    const match = seatCode.match(/(\d+)$/);
    return match ? parseInt(match[1], 10) : 0;
  };

  const getDisplayLabel = (seat: Seat) => {
    if (seat.seatCode.startsWith('SEAT-GT')) {
      const parts = seat.seatCode.replace('SEAT-GT', '').split('-');
      if (parts.length >= 2) return `G${parts[0]}-D${parts[1]}`;
      return seat.seatCode.replace('SEAT-', '');
    }
    return seat.seatCode.replace('SEAT-', '');
  };

  // Dynamic pod seat groupings
  const stationASeats = useMemo(() => {
    return seats
      .filter((s) => s.podLabel?.toLowerCase() === 'station a' || /^SEAT-A\d+$/i.test(s.seatCode))
      .sort((a, b) => extractSeatNumber(a.seatCode) - extractSeatNumber(b.seatCode));
  }, [seats]);

  const stationBSeats = useMemo(() => {
    return seats
      .filter((s) => s.podLabel?.toLowerCase() === 'station b' || /^SEAT-B\d+$/i.test(s.seatCode))
      .sort((a, b) => extractSeatNumber(a.seatCode) - extractSeatNumber(b.seatCode));
  }, [seats]);

  const stationCSeats = useMemo(() => {
    return seats
      .filter((s) => s.podLabel?.toLowerCase() === 'station c' || /^SEAT-C\d+$/i.test(s.seatCode))
      .sort((a, b) => extractSeatNumber(a.seatCode) - extractSeatNumber(b.seatCode));
  }, [seats]);

  const stationDSeats = useMemo(() => {
    return seats
      .filter((s) => s.podLabel?.toLowerCase() === 'station d' || /^SEAT-D\d+$/i.test(s.seatCode))
      .sort((a, b) => extractSeatNumber(a.seatCode) - extractSeatNumber(b.seatCode));
  }, [seats]);

  const stationESeats = useMemo(() => {
    return seats
      .filter((s) => s.podLabel?.toLowerCase() === 'station e' || /^SEAT-E\d+$/i.test(s.seatCode))
      .sort((a, b) => extractSeatNumber(a.seatCode) - extractSeatNumber(b.seatCode));
  }, [seats]);

  const gt1Seats = useMemo(() => {
    return seats
      .filter((s) => s.groupTableId === 1 || s.podLabel?.toLowerCase() === 'group table 1' || /GT1-/i.test(s.seatCode))
      .sort((a, b) => extractSeatNumber(a.seatCode) - extractSeatNumber(b.seatCode));
  }, [seats]);

  const gt2Seats = useMemo(() => {
    return seats
      .filter((s) => s.groupTableId === 2 || s.podLabel?.toLowerCase() === 'group table 2' || /GT2-/i.test(s.seatCode))
      .sort((a, b) => extractSeatNumber(a.seatCode) - extractSeatNumber(b.seatCode));
  }, [seats]);

  const gt3Seats = useMemo(() => {
    return seats
      .filter((s) => s.groupTableId === 3 || s.podLabel?.toLowerCase() === 'group table 3' || /GT3-/i.test(s.seatCode))
      .sort((a, b) => extractSeatNumber(a.seatCode) - extractSeatNumber(b.seatCode));
  }, [seats]);

  const gt4Seats = useMemo(() => {
    return seats
      .filter((s) => s.groupTableId === 4 || s.podLabel?.toLowerCase() === 'group table 4' || /GT4-/i.test(s.seatCode))
      .sort((a, b) => extractSeatNumber(a.seatCode) - extractSeatNumber(b.seatCode));
  }, [seats]);

  const gt5Seats = useMemo(() => {
    return seats
      .filter((s) => s.groupTableId === 5 || s.podLabel?.toLowerCase() === 'group table 5' || /GT5-/i.test(s.seatCode))
      .sort((a, b) => extractSeatNumber(a.seatCode) - extractSeatNumber(b.seatCode));
  }, [seats]);

  const customPods = useMemo(() => {
    const recognized = new Set<string>();
    [
      ...stationASeats,
      ...stationBSeats,
      ...stationCSeats,
      ...stationDSeats,
      ...stationESeats,
      ...gt1Seats,
      ...gt2Seats,
      ...gt3Seats,
      ...gt4Seats,
      ...gt5Seats,
    ].forEach((s) => recognized.add(s.seatCode));

    const leftovers = seats.filter((s) => !recognized.has(s.seatCode));
    const podsMap: Record<string, Seat[]> = {};
    leftovers.forEach((s) => {
      const p = s.podLabel || 'Custom Station';
      if (!podsMap[p]) podsMap[p] = [];
      podsMap[p].push(s);
    });
    return Object.entries(podsMap);
  }, [
    seats,
    stationASeats,
    stationBSeats,
    stationCSeats,
    stationDSeats,
    stationESeats,
    gt1Seats,
    gt2Seats,
    gt3Seats,
    gt4Seats,
    gt5Seats,
  ]);

  // Helper to find seat by exact code suffix (e.g. 'A1' or 'GT1-1' or 'SEAT-A1')
  const findSeat = (code: string) => {
    return (
      seats.find(
        (s) =>
          s.seatCode === code ||
          s.seatCode === `SEAT-${code}` ||
          s.seatCode.endsWith(`-${code}`) ||
          s.seatCode.endsWith(code),
      ) ?? null
    );
  };

  const isDeskDimmed = (seat: Seat, displayLabel: string) => {
    if (statusFilter !== 'ALL' && seat.status !== statusFilter) return true;
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const codeMatch = seat.seatCode.toLowerCase().includes(q);
      const labelMatch = displayLabel.toLowerCase().includes(q);
      return !codeMatch && !labelMatch;
    }
    return false;
  };

  // Reusable Desk Component
  const DeskItem = ({
    seat: providedSeat,
    seatCode,
    displayLabel,
    podLabel,
    groupTableId,
    tableType,
    customClass = '',
  }: {
    seat?: Seat;
    seatCode?: string;
    displayLabel?: string;
    podLabel?: string;
    groupTableId?: number;
    tableType?: 'INDIVIDUAL' | 'GROUP';
    customClass?: string;
  }) => {
    const seat =
      providedSeat ||
      (seatCode ? findSeat(seatCode) : null) ||
      ({
        id: 0,
        roomId: 1,
        seatCode: seatCode ? (seatCode.startsWith('SEAT-') ? seatCode : `SEAT-${seatCode}`) : 'UNKNOWN',
        xPosition: 0,
        yPosition: 0,
        podLabel,
        tableType,
        groupTableId,
        status: 'AVAILABLE',
      } as Seat);

    const label = displayLabel || getDisplayLabel(seat);
    const isSelected = selectedSeat?.seatCode === seat.seatCode || (selectedSeat && selectedSeat.id === seat.id && seat.id !== 0);
    const dimmed = isDeskDimmed(seat, label);

    // Compute status appearance matching screenshot
    let bgBorder = 'bg-white dark:bg-card border-slate-200 dark:border-slate-800 text-foreground hover:border-slate-400';
    let icon = <span className="w-2 h-2 rounded-full border border-emerald-500 bg-emerald-500 shrink-0" />;

    if (isSelected) {
      bgBorder = 'bg-blue-50/80 dark:bg-blue-950/60 border-2 border-blue-600 text-blue-900 dark:text-blue-200 shadow-sm z-10';
      icon = <Check className="w-3.5 h-3.5 text-blue-600 stroke-[3] shrink-0" />;
    } else {
      switch (seat.status) {
        case 'OCCUPIED':
          bgBorder = 'bg-slate-100 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200';
          icon = <UserIcon className="w-3 h-3 text-slate-600 dark:text-slate-300 shrink-0" />;
          break;
        case 'RESERVED':
          bgBorder = 'bg-indigo-50/90 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200';
          icon = <Bookmark className="w-3 h-3 text-indigo-600 fill-indigo-600 shrink-0" />;
          break;
        case 'EXPIRING_SOON':
          bgBorder = 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200';
          icon = <Clock className="w-3 h-3 text-amber-600 shrink-0" />;
          break;
        case 'MAINTENANCE':
          bgBorder = 'bg-amber-50/90 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200';
          icon = <Wrench className="w-3 h-3 text-amber-700 shrink-0" />;
          break;
        case 'AVAILABLE':
        default:
          bgBorder = 'bg-white dark:bg-card border-slate-200 dark:border-slate-700 text-foreground hover:border-slate-400';
          icon = <span className="w-2 h-2 rounded-full border border-emerald-500 bg-emerald-500 shrink-0" />;
          break;
      }
    }

    return (
      <button
        type="button"
        onClick={() => onSelectSeat(seat)}
        className={`rounded-lg border px-2.5 py-1.5 flex items-center justify-between gap-1.5 transition-all cursor-pointer shadow-3xs select-none ${bgBorder} ${
          dimmed ? 'opacity-25 grayscale-[0.6]' : 'opacity-100'
        } ${customClass}`}
        title={`${seat.seatCode} - ${seat.status}`}
      >
        <span className="font-semibold text-xs leading-none tracking-tight">{label}</span>
        {icon}
      </button>
    );
  };

  return (
    <div className="bg-card rounded-2xl border border-border/80 shadow-xs p-5 sm:p-6 space-y-4">
      {/* 1. Header Row: Title & View Segmented Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <Layers className="w-4 h-4 text-primary shrink-0" />
          <h2 className="text-sm sm:text-base font-bold text-foreground tracking-tight">
            Floor plan
          </h2>
          <span className="text-xs text-muted-foreground font-medium">
            Ground floor · Room 101
          </span>
        </div>

        {/* View Switcher: All workspaces | Individual desks | Group tables */}
        <div className="flex items-center p-1 bg-muted/60 rounded-xl border border-border/60 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setFilterMode("ALL")}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              filterMode === "ALL"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            All workspaces
          </button>
          <button
            type="button"
            onClick={() => setFilterMode("INDIVIDUAL")}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              filterMode === "INDIVIDUAL"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Individual desks
          </button>
          <button
            type="button"
            onClick={() => setFilterMode("GROUP")}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              filterMode === "GROUP"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Group tables
          </button>
        </div>
      </div>

      {/* 2. Controls & Legend Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-1">
        {/* Left: Filter dropdown + Search input */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Status filter dropdown using Shadcn DropdownMenu */}
          <DropdownMenu>
            <DropdownMenuTrigger className="h-8 px-2.5 text-xs font-semibold rounded-lg border border-border bg-background hover:bg-muted/50 text-foreground flex items-center gap-2 transition-colors cursor-pointer shadow-2xs outline-none">
              <SlidersHorizontal className="w-3.5 h-3.5 text-muted-foreground" />
              <span>
                {statusFilter === "ALL"
                  ? "All statuses"
                  : statusFilter === "AVAILABLE"
                    ? "Available"
                    : statusFilter === "OCCUPIED"
                      ? "In use"
                      : statusFilter === "RESERVED"
                        ? "Reserved"
                        : statusFilter === "EXPIRING_SOON"
                          ? "Ending soon"
                          : "Repair"}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-44 p-1 z-50">
              <DropdownMenuItem
                onClick={() => setStatusFilter("ALL")}
                className={`text-xs py-1.5 cursor-pointer flex items-center justify-between ${
                  statusFilter === "ALL"
                    ? "bg-primary/10 text-primary font-bold"
                    : ""
                }`}
              >
                <span>All statuses</span>
                {statusFilter === "ALL" && <Check className="w-3.5 h-3.5" />}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setStatusFilter("AVAILABLE")}
                className={`text-xs py-1.5 cursor-pointer flex items-center justify-between ${
                  statusFilter === "AVAILABLE"
                    ? "bg-primary/10 text-primary font-bold"
                    : ""
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full border border-emerald-500 bg-emerald-500" />
                  <span>Available</span>
                </div>
                {statusFilter === "AVAILABLE" && (
                  <Check className="w-3.5 h-3.5" />
                )}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setStatusFilter("OCCUPIED")}
                className={`text-xs py-1.5 cursor-pointer flex items-center justify-between ${
                  statusFilter === "OCCUPIED"
                    ? "bg-primary/10 text-primary font-bold"
                    : ""
                }`}
              >
                <div className="flex items-center gap-2">
                  <UserIcon className="w-3 h-3 text-slate-700 dark:text-slate-300" />
                  <span>In use</span>
                </div>
                {statusFilter === "OCCUPIED" && (
                  <Check className="w-3.5 h-3.5" />
                )}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setStatusFilter("RESERVED")}
                className={`text-xs py-1.5 cursor-pointer flex items-center justify-between ${
                  statusFilter === "RESERVED"
                    ? "bg-primary/10 text-primary font-bold"
                    : ""
                }`}
              >
                <div className="flex items-center gap-2">
                  <Bookmark className="w-3 h-3 text-indigo-600 fill-indigo-600" />
                  <span>Reserved</span>
                </div>
                {statusFilter === "RESERVED" && (
                  <Check className="w-3.5 h-3.5" />
                )}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setStatusFilter("EXPIRING_SOON")}
                className={`text-xs py-1.5 cursor-pointer flex items-center justify-between ${
                  statusFilter === "EXPIRING_SOON"
                    ? "bg-primary/10 text-primary font-bold"
                    : ""
                }`}
              >
                <div className="flex items-center gap-2">
                  <Clock className="w-3 h-3 text-amber-600" />
                  <span>Ending soon</span>
                </div>
                {statusFilter === "EXPIRING_SOON" && (
                  <Check className="w-3.5 h-3.5" />
                )}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setStatusFilter("MAINTENANCE")}
                className={`text-xs py-1.5 cursor-pointer flex items-center justify-between ${
                  statusFilter === "MAINTENANCE"
                    ? "bg-primary/10 text-primary font-bold"
                    : ""
                }`}
              >
                <div className="flex items-center gap-2">
                  <Wrench className="w-3 h-3 text-amber-700" />
                  <span>Repair</span>
                </div>
                {statusFilter === "MAINTENANCE" && (
                  <Check className="w-3.5 h-3.5" />
                )}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Search desk ID */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Find a desk ID"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 pl-8 pr-3 text-xs rounded-lg border border-border bg-background placeholder:text-muted-foreground text-foreground w-44 focus:outline-none focus:ring-1 focus:ring-primary transition-colors shadow-2xs"
            />
          </div>
        </div>

        {/* Right: Legend */}
        <div className="flex flex-wrap items-center gap-3.5 text-xs text-muted-foreground font-medium">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full border border-emerald-500 bg-emerald-500" />
            <span className="text-[11px]">Available</span>
          </div>
          <div className="flex items-center gap-1.5">
            <UserIcon className="w-3 h-3 text-slate-700 dark:text-slate-300" />
            <span className="text-[11px]">In use</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Bookmark className="w-3 h-3 text-indigo-600 fill-indigo-600" />
            <span className="text-[11px]">Reserved</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3 h-3 text-amber-600" />
            <span className="text-[11px]">Ending soon</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Wrench className="w-3 h-3 text-amber-700" />
            <span className="text-[11px]">Repair</span>
          </div>
        </div>
      </div>

      {/* 3. The 2D Floor Plan Canvas */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-[#F8FAFC] dark:bg-slate-950/40 p-6 sm:p-8 relative">
        {/* Top Center: WINDOWS label */}
        <div className="text-center font-mono text-[10px] tracking-widest text-slate-400 font-bold uppercase select-none mb-3">
          WINDOWS
        </div>

        {/* Top Right: Zoom & Fullscreen Controls */}
        <div className="absolute top-4 right-4 flex items-center bg-white dark:bg-card border border-slate-200 dark:border-slate-700 rounded-lg p-0.5 shadow-2xs z-20">
          <button
            type="button"
            onClick={() => setZoomLevel((z) => Math.max(z - 10, 80))}
            className="w-6 h-6 flex items-center justify-center text-xs text-muted-foreground hover:text-foreground font-bold cursor-pointer"
            title="Zoom out"
          >
            —
          </button>
          <span className="text-[11px] font-semibold text-foreground px-1.5 min-w-[40px] text-center">
            {zoomLevel}%
          </span>
          <button
            type="button"
            onClick={() => setZoomLevel((z) => Math.min(z + 10, 130))}
            className="w-6 h-6 flex items-center justify-center text-xs text-muted-foreground hover:text-foreground font-bold cursor-pointer"
            title="Zoom in"
          >
            +
          </button>
          <button
            type="button"
            onClick={() => setZoomLevel(100)}
            className="w-6 h-6 flex items-center justify-center text-muted-foreground hover:text-foreground border-l border-slate-200 dark:border-slate-700 cursor-pointer pl-1 ml-0.5"
            title="Reset zoom"
          >
            <Maximize2 className="w-3 h-3" />
          </button>
        </div>

        {/* Scalable Layout Board */}
        <div
          className="min-w-[960px] mx-auto transition-transform origin-top flex flex-row gap-6 items-start justify-between"
          style={{ transform: `scale(${zoomLevel / 100})` }}
        >
          {/* Main Area: Stations A-E, Group Tables 1, 3, 5 */}
          <div className="flex-1 flex flex-col gap-6">
            {/* ROW 1: Station A, Station B, Group table 1 */}
            <div className="flex items-center gap-5">
              {/* Station A */}
              {(filterMode === "ALL" || filterMode === "INDIVIDUAL") && (
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-card shadow-2xs space-y-3 min-w-56 flex-1 max-w-[280px]">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-foreground">Station A</span>
                    <span className="text-[11px] text-muted-foreground font-medium">
                      {stationASeats.length} desks
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {stationASeats.map((seat) => (
                      <DeskItem
                        key={seat.id || seat.seatCode}
                        seat={seat}
                        podLabel="Station A"
                        tableType="INDIVIDUAL"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Station B */}
              {(filterMode === "ALL" || filterMode === "INDIVIDUAL") && (
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-card shadow-2xs space-y-3 min-w-56 flex-1 max-w-[280px]">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-foreground">Station B</span>
                    <span className="text-[11px] text-muted-foreground font-medium">
                      {stationBSeats.length} desks
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {stationBSeats.map((seat) => (
                      <DeskItem
                        key={seat.id || seat.seatCode}
                        seat={seat}
                        podLabel="Station B"
                        tableType="INDIVIDUAL"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Group table 1 */}
              {(filterMode === "ALL" || filterMode === "GROUP") && (
                <div className="min-w-40 min-h-40 rounded-full bg-slate-100/90 dark:bg-slate-700/80 p-3.5 flex flex-col items-center justify-center shadow-2xs shrink-0 ml-4">
                  <span className="font-bold text-xs text-foreground text-center">
                    Group table 1
                  </span>
                  <span className="text-[10px] text-gray-400 text-center mb-2.5">
                    {gt1Seats.length} shared desks
                  </span>
                  <div className="flex items-center flex-wrap justify-center gap-1.5 max-w-[140px]">
                    {gt1Seats.map((seat) => (
                      <DeskItem
                        key={seat.id || seat.seatCode}
                        seat={seat}
                        podLabel="Group table 1"
                        groupTableId={1}
                        tableType="GROUP"
                        customClass="w-14 px-1.5"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Middle Walkway Label */}
            <div className="text-center font-mono text-[10px] tracking-widest text-slate-400 font-bold uppercase select-none my-1">
              MAIN WALKWAY
            </div>

            {/* ROW 2: Group table 3, Station C, Station D, Station E */}
            <div className="flex items-center gap-12">
              {/* Group table 3 */}
              {(filterMode === "ALL" || filterMode === "GROUP") && (
                <div className="w-50 h-50 rounded-full bg-slate-100/90 dark:bg-slate-700/80 p-3 flex flex-col items-center justify-center shadow-2xs shrink-0">
                  <span className="font-bold text-xs text-foreground text-center">
                    Group table 3
                  </span>
                  <span className="text-[10px] text-gray-400 text-center mb-2">
                    {gt3Seats.length} shared desks
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {gt3Seats.map((seat) => (
                      <DeskItem
                        key={seat.id || seat.seatCode}
                        seat={seat}
                        podLabel="Group table 3"
                        groupTableId={3}
                        tableType="GROUP"
                        customClass="w-14 px-1.5"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Station C */}
              {(filterMode === "ALL" || filterMode === "INDIVIDUAL") && (
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-card shadow-2xs space-y-3 min-w-44 flex-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-foreground">Station C</span>
                    <span className="text-[11px] text-muted-foreground font-medium">
                      {stationCSeats.length} desks
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {stationCSeats.map((seat) => (
                      <DeskItem
                        key={seat.id || seat.seatCode}
                        seat={seat}
                        podLabel="Station C"
                        tableType="INDIVIDUAL"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Station D */}
              {(filterMode === "ALL" || filterMode === "INDIVIDUAL") && (
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-card shadow-2xs space-y-3 min-w-36">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-foreground">Station D</span>
                    <span className="text-[11px] text-muted-foreground font-medium">
                      {stationDSeats.length} desks
                    </span>
                  </div>
                  <div className="flex flex-col gap-2">
                    {stationDSeats.map((seat) => (
                      <DeskItem
                        key={seat.id || seat.seatCode}
                        seat={seat}
                        podLabel="Station D"
                        tableType="INDIVIDUAL"
                        customClass="w-full"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Station E */}
              {(filterMode === "ALL" || filterMode === "INDIVIDUAL") && (
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-card shadow-2xs space-y-3 min-w-44 flex-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-foreground">Station E</span>
                    <span className="text-[11px] text-muted-foreground font-medium">
                      {stationESeats.length} desks
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {stationESeats.map((seat) => (
                      <DeskItem
                        key={seat.id || seat.seatCode}
                        seat={seat}
                        podLabel="Station E"
                        tableType="INDIVIDUAL"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ROW 3: Group table 5 & Entrance Swing Arc */}
            <div className="flex items-center justify-between gap-6 pt-2">
              {/* Group table 5 */}
              {(filterMode === "ALL" || filterMode === "GROUP") && (
                <div className="rounded-3xl bg-slate-100/90 dark:bg-slate-700/80 px-6 py-4 flex flex-col items-center shadow-2xs">
                  <span className="font-bold text-xs text-foreground text-center">
                    Group table 5
                  </span>
                  <span className="text-[10px] text-gray-400 text-center mb-3">
                    {gt5Seats.length} shared desks
                  </span>
                  <div className="grid grid-cols-4 gap-2">
                    {gt5Seats.map((seat) => (
                      <DeskItem
                        key={seat.id || seat.seatCode}
                        seat={seat}
                        podLabel="Group table 5"
                        groupTableId={5}
                        tableType="GROUP"
                        customClass="w-16 px-1.5"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Architectural Entrance Doorway */}
              <div className="flex flex-col items-center justify-end self-end pr-8 pb-0">
                <svg
                  width="76"
                  height="76"
                  viewBox="0 0 76 76"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="text-slate-300 dark:text-slate-600"
                >
                  {/* Vertical door leaf standing open at 90 degrees */}
                  <line
                    x1="3"
                    y1="73"
                    x2="3"
                    y2="3"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  {/* Quarter-circle door swing arc */}
                  <path
                    d="M 3 3 A 70 70 0 0 1 73 73"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                  />
                </svg>

                {/* Entrance Arrow & Label */}
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 mt-2 select-none">
                  <ArrowUp className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Entrance</span>
                </div>

                {/* Wall threshold with entrance opening */}
                <div className="flex items-center w-36 mt-2">
                  <div className="flex-1 h-[1.5px] bg-slate-300 dark:bg-slate-700" />
                  <div className="w-20" />
                  <div className="flex-1 h-[1.5px] bg-slate-300 dark:bg-slate-700" />
                </div>
              </div>
            </div>

            {/* Custom / Additional Pods (if any custom or dynamically added pods exist) */}
            {customPods.length > 0 && (
              <div className="pt-4 border-t border-dashed border-slate-200 dark:border-slate-800 space-y-3">
                <div className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Additional Workstations & Stations
                </div>
                <div className="flex flex-wrap gap-4">
                  {customPods.map(([podName, podSeats]) => (
                    <div
                      key={podName}
                      className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-card shadow-2xs space-y-3 min-w-48"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-foreground">{podName}</span>
                        <span className="text-[11px] text-muted-foreground font-medium">
                          {podSeats.length} desks
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {podSeats.map((seat) => (
                          <DeskItem
                            key={seat.id || seat.seatCode}
                            seat={seat}
                            podLabel={podName}
                            tableType={seat.tableType || 'INDIVIDUAL'}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Group table 2 (top) and Group table 4 (bottom) */}
          {(filterMode === "ALL" || filterMode === "GROUP") && (
            <div className="flex flex-col gap-8 shrink-0 items-center justify-between">
              {/* Group table 2 */}
              <div className="w-40 rounded-3xl bg-slate-100/90 dark:bg-slate-700/80 p-3.5 flex flex-col items-center shadow-2xs">
                <span className="font-bold text-xs text-foreground text-center">
                  Group table 2
                </span>
                <span className="text-[10px] text-gray-400 text-center mb-3">
                  {gt2Seats.length} shared desks
                </span>
                <div className="grid grid-cols-2 gap-2 mb-2 w-full">
                  {gt2Seats.map((seat) => (
                    <DeskItem
                      key={seat.id || seat.seatCode}
                      seat={seat}
                      podLabel="Group table 2"
                      groupTableId={2}
                      tableType="GROUP"
                      customClass="px-1.5"
                    />
                  ))}
                </div>
              </div>

              {/* Group table 4 */}
              <div className="w-50 rounded-3xl bg-slate-100/90 dark:bg-slate-700/80 p-3.5 flex flex-col items-center shadow-2xs">
                <span className="font-bold text-xs text-foreground text-center">
                  Group table 4
                </span>
                <span className="text-[10px] text-gray-400 text-center mb-3">
                  {gt4Seats.length} shared desks
                </span>
                <div className="grid grid-cols-2 gap-2 mb-2 w-full">
                  {gt4Seats.map((seat) => (
                    <DeskItem
                      key={seat.id || seat.seatCode}
                      seat={seat}
                      podLabel="Group table 4"
                      groupTableId={4}
                      tableType="GROUP"
                      customClass="px-1.5"
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 4. Footer Helper Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-muted-foreground pt-1">
        <div className="flex items-center gap-1.5 font-medium">
          <span className="text-primary font-bold">↗</span>
          <span>{isAdminMode ? 'Select any workstation to inspect details or manage its status and settings.' : 'Select an available desk to view details and reserve.'}</span>
        </div>
        <div className="font-medium text-muted-foreground/80">
          {seats.filter(s => s.tableType === 'INDIVIDUAL').length} individual desks · {seats.filter(s => s.tableType === 'GROUP').length} group desks ({seats.length} total)
        </div>
      </div>
    </div>
  );
}
