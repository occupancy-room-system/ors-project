import React, { useState } from 'react';
import { Seat, Room } from '../../types';

interface RoomMap2DProps {
  room: Room;
  seats: Seat[];
  selectedSeat: Seat | null;
  onSelectSeat: (seat: Seat) => void;
  onScanQR?: (seat: Seat) => void;
}

export const RoomMap2D: React.FC<RoomMap2DProps> = ({
  room,
  seats,
  selectedSeat,
  onSelectSeat,
}) => {
  const [filterMode, setFilterMode] = useState<'ALL' | 'INDIVIDUAL' | 'GROUP'>('ALL');

  // Helpers to get seat style by status
  const getSeatColor = (status: Seat['status']) => {
    switch (status) {
      case 'AVAILABLE':
        return {
          bg: 'bg-emerald-50 hover:bg-emerald-100 active:bg-emerald-200',
          border: 'border-emerald-400 hover:border-emerald-500',
          text: 'text-emerald-800',
          indicator: 'bg-emerald-500',
          label: 'Free',
          badgeBg: 'bg-emerald-100 text-emerald-800',
        };
      case 'OCCUPIED':
        return {
          bg: 'bg-rose-50 hover:bg-rose-100 active:bg-rose-200',
          border: 'border-rose-300 hover:border-rose-400',
          text: 'text-rose-800',
          indicator: 'bg-rose-500',
          label: 'Occupied',
          badgeBg: 'bg-rose-100 text-rose-800',
        };
      case 'RESERVED':
        return {
          bg: 'bg-indigo-50 hover:bg-indigo-100 active:bg-indigo-200',
          border: 'border-indigo-300 hover:border-indigo-400',
          text: 'text-indigo-800',
          indicator: 'bg-indigo-500',
          label: 'Reserved',
          badgeBg: 'bg-indigo-100 text-indigo-800',
        };
      case 'EXPIRING_SOON':
        return {
          bg: 'bg-amber-50 hover:bg-amber-100 active:bg-amber-200',
          border: 'border-amber-400 hover:border-amber-500',
          text: 'text-amber-800',
          indicator: 'bg-amber-500',
          label: 'Expiring',
          badgeBg: 'bg-amber-100 text-amber-800',
        };
      case 'MAINTENANCE':
        return {
          bg: 'bg-slate-100',
          border: 'border-slate-300',
          text: 'text-slate-500',
          indicator: 'bg-slate-400',
          label: 'Repair',
          badgeBg: 'bg-slate-200 text-slate-700',
        };
      default:
        return {
          bg: 'bg-slate-50',
          border: 'border-slate-300',
          text: 'text-slate-700',
          indicator: 'bg-slate-400',
          label: 'Unknown',
          badgeBg: 'bg-slate-100 text-slate-600',
        };
    }
  };

  // Group seats by podLabel
  const stationASeats = seats.filter((s) => s.podLabel === 'Station A');
  const stationBSeats = seats.filter((s) => s.podLabel === 'Station B');
  const groupTable1Seats = seats.filter((s) => s.podLabel === 'Group Table 1' || s.groupTableId === 1);
  const groupTable2Seats = seats.filter((s) => s.podLabel === 'Group Table 2' || s.groupTableId === 2);
  const groupTable3Seats = seats.filter((s) => s.podLabel === 'Group Table 3' || s.groupTableId === 3);
  const stationCSeats = seats.filter((s) => s.podLabel === 'Station C');
  const stationDSeats = seats.filter((s) => s.podLabel === 'Station D');
  const stationESeats = seats.filter((s) => s.podLabel === 'Station E');
  const groupTable5Seats = seats.filter((s) => s.podLabel === 'Group Table 5' || s.groupTableId === 5);
  const groupTable4Seats = seats.filter((s) => s.podLabel === 'Group Table 4' || s.groupTableId === 4);

  // Group table status helper
  const getGroupTableStatus = (tableSeats: Seat[]) => {
    if (tableSeats.some((s) => s.status === 'MAINTENANCE')) return 'MAINTENANCE';
    if (tableSeats.some((s) => s.status === 'OCCUPIED' || s.status === 'EXPIRING_SOON')) return 'OCCUPIED';
    if (tableSeats.some((s) => s.status === 'RESERVED')) return 'RESERVED';
    return 'AVAILABLE';
  };

  const isGroupTableSelected = (tableId: number) => {
    return selectedSeat?.tableType === 'GROUP' && selectedSeat?.groupTableId === tableId;
  };

  const handleGroupTableClick = (tableSeats: Seat[]) => {
    if (tableSeats.length > 0) {
      onSelectSeat(tableSeats[0]);
    }
  };

  const availableCount = seats.filter((s) => s.status === 'AVAILABLE').length;
  const individualAvailable = seats.filter((s) => s.tableType === 'INDIVIDUAL' && s.status === 'AVAILABLE').length;
  const groupAvailable = [groupTable1Seats, groupTable2Seats, groupTable3Seats, groupTable4Seats, groupTable5Seats]
    .filter((ts) => getGroupTableStatus(ts) === 'AVAILABLE').length;

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-4 sm:p-6 overflow-hidden space-y-4">
      {/* Header & Stats Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
              {room.name} · Architectural Floor Plan
            </h2>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              {availableCount} of {seats.length} Desks Free
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {room.building} · Floor {room.floorLevel} · 5 Individual Stations (A–E, 22 desks) + 5 Group Tables (1–5, 32 desks)
          </p>
        </div>

        {/* Legend & Filter Controls */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="flex items-center p-0.5 bg-slate-100 rounded-xl text-xs font-semibold text-slate-600">
            <button
              onClick={() => setFilterMode('ALL')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                filterMode === 'ALL' ? 'bg-white text-blue-700 shadow-2xs font-bold' : 'hover:text-slate-900'
              }`}
            >
              All (54)
            </button>
            <button
              onClick={() => setFilterMode('INDIVIDUAL')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                filterMode === 'INDIVIDUAL' ? 'bg-white text-blue-700 shadow-2xs font-bold' : 'hover:text-slate-900'
              }`}
            >
              Stations A–E ({individualAvailable} free)
            </button>
            <button
              onClick={() => setFilterMode('GROUP')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                filterMode === 'GROUP' ? 'bg-white text-blue-700 shadow-2xs font-bold' : 'hover:text-slate-900'
              }`}
            >
              Group Tables ({groupAvailable}/5 free)
            </button>
          </div>

          {/* Color Legend */}
          <div className="hidden sm:flex items-center gap-3 text-[11px] font-medium text-slate-500 border-l border-slate-200 pl-3">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Free
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" /> Reserved
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Occupied
            </span>
          </div>
        </div>
      </div>

      {/* Behavioral Notice Card */}
      <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between text-xs text-blue-900 gap-2">
        <div className="flex items-center gap-2">
          <span className="text-base">📌</span>
          <div>
            <span className="font-bold">Reservation Policy:</span>
            <span className="text-blue-800 ml-1">
              <strong>Stations A–E</strong> are individual desks (1 student reserves 1 desk). 
              <strong>Group Tables 1–5</strong> are collaborative tables (1 student reserves the entire table, occupying all desks together).
            </span>
          </div>
        </div>
      </div>

      {/* Mobile Scroll Hint */}
      <div className="lg:hidden text-center text-[11px] text-blue-600 font-medium py-0.5 flex items-center justify-center gap-1">
        <span>👈👉</span>
        <span>Swipe horizontally to view complete room layout</span>
      </div>

      {/* 2D ARCHITECTURAL FLOOR CANVAS MATCHING THE DIAGRAM PHOTO */}
      <div className="relative bg-slate-50/70 border-2 border-slate-300 rounded-3xl p-4 sm:p-6 overflow-x-auto shadow-inner">
        <div className="min-w-[860px] max-w-5xl mx-auto space-y-6">

          {/* TOP / FRONT WHITEBOARD & TEACHER PODIUM */}
          <div className="flex items-center justify-between max-w-2xl mx-auto pb-1">
            <div className="h-6 flex-1 bg-slate-200/90 border border-slate-300 rounded-lg flex items-center justify-center text-[10px] font-bold text-slate-600 uppercase tracking-widest shadow-2xs">
              🖥️ Front Interactive Display & Presentation Screen
            </div>
          </div>

          {/* ============================================================================== */}
          {/* ROW 1: STATION A (Left), STATION B (Center), GROUP TABLE 1 (Right), GROUP TABLE 2 (Far Right Oval) */}
          {/* ============================================================================== */}
          <div className="grid grid-cols-12 gap-4 items-start">
            
            {/* STATION A (Rounded Rectangle, 6 Desks, Individual) */}
            <div
              className={`col-span-4 p-3.5 rounded-2xl border-2 transition-all bg-white shadow-xs ${
                filterMode === 'GROUP' ? 'opacity-40' : ''
              } ${
                stationASeats.some((s) => selectedSeat?.id === s.id)
                  ? 'border-blue-600 ring-2 ring-blue-500/20 shadow-md'
                  : 'border-slate-300 hover:border-slate-400'
              }`}
            >
              <div className="flex items-center justify-between mb-2 pb-1 border-b border-slate-100">
                <div className="flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-md bg-blue-100 text-blue-700 font-extrabold text-[11px] flex items-center justify-center">
                    A
                  </span>
                  <span className="text-xs font-extrabold text-slate-900 tracking-tight">Station A</span>
                </div>
                <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                  6 Desks (1/student)
                </span>
              </div>

              {/* 3x2 Grid of Desks (A1-A6) */}
              <div className="grid grid-cols-3 gap-2">
                {stationASeats.map((seat) => {
                  const colors = getSeatColor(seat.status);
                  const isSelected = selectedSeat?.id === seat.id;
                  return (
                    <button
                      key={seat.id}
                      onClick={() => onSelectSeat(seat)}
                      className={`flex flex-col items-center justify-between p-1.5 rounded-xl border transition-all cursor-pointer select-none min-h-[46px] shadow-2xs ${colors.bg} ${colors.border} ${
                        isSelected ? 'ring-2 ring-blue-600 scale-105 z-10 shadow-sm' : 'hover:scale-102 active:scale-95'
                      }`}
                      title={`${seat.seatCode} (${seat.status}) - Single Desk Reservation`}
                    >
                      <div className="w-full flex items-center justify-between px-0.5">
                        <span className={`text-[10px] font-bold ${colors.text}`}>
                          {seat.seatCode.replace('SEAT-', '')}
                        </span>
                        <span className={`w-1.5 h-1.5 rounded-full ${colors.indicator}`} />
                      </div>
                      <div className="w-6 h-1.5 bg-slate-300 rounded-2xs my-0.5" />
                      <span className="text-[8px] font-mono text-slate-500 font-medium">{colors.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* STATION B (Rounded Rectangle, 6 Desks, Individual) */}
            <div
              className={`col-span-4 p-3.5 rounded-2xl border-2 transition-all bg-white shadow-xs ${
                filterMode === 'GROUP' ? 'opacity-40' : ''
              } ${
                stationBSeats.some((s) => selectedSeat?.id === s.id)
                  ? 'border-blue-600 ring-2 ring-blue-500/20 shadow-md'
                  : 'border-slate-300 hover:border-slate-400'
              }`}
            >
              <div className="flex items-center justify-between mb-2 pb-1 border-b border-slate-100">
                <div className="flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-md bg-blue-100 text-blue-700 font-extrabold text-[11px] flex items-center justify-center">
                    B
                  </span>
                  <span className="text-xs font-extrabold text-slate-900 tracking-tight">Station B</span>
                </div>
                <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                  6 Desks (1/student)
                </span>
              </div>

              {/* 3x2 Grid of Desks (B1-B6) */}
              <div className="grid grid-cols-3 gap-2">
                {stationBSeats.map((seat) => {
                  const colors = getSeatColor(seat.status);
                  const isSelected = selectedSeat?.id === seat.id;
                  return (
                    <button
                      key={seat.id}
                      onClick={() => onSelectSeat(seat)}
                      className={`flex flex-col items-center justify-between p-1.5 rounded-xl border transition-all cursor-pointer select-none min-h-[46px] shadow-2xs ${colors.bg} ${colors.border} ${
                        isSelected ? 'ring-2 ring-blue-600 scale-105 z-10 shadow-sm' : 'hover:scale-102 active:scale-95'
                      }`}
                      title={`${seat.seatCode} (${seat.status}) - Single Desk Reservation`}
                    >
                      <div className="w-full flex items-center justify-between px-0.5">
                        <span className={`text-[10px] font-bold ${colors.text}`}>
                          {seat.seatCode.replace('SEAT-', '')}
                        </span>
                        <span className={`w-1.5 h-1.5 rounded-full ${colors.indicator}`} />
                      </div>
                      <div className="w-6 h-1.5 bg-slate-300 rounded-2xs my-0.5" />
                      <span className="text-[8px] font-mono text-slate-500 font-medium">{colors.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* GROUP TABLE 1 (Circle in diagram, 2 Desks, Group Booking) */}
            <div
              className={`col-span-2 flex flex-col items-center ${
                filterMode === 'INDIVIDUAL' ? 'opacity-40' : ''
              }`}
            >
              <div
                onClick={() => handleGroupTableClick(groupTable1Seats)}
                className={`w-32 h-32 rounded-full border-2 p-2 flex flex-col items-center justify-center cursor-pointer transition-all shadow-xs relative bg-white ${
                  isGroupTableSelected(1)
                    ? 'border-indigo-600 ring-4 ring-indigo-500/20 bg-indigo-50/40 scale-105'
                    : getGroupTableStatus(groupTable1Seats) === 'AVAILABLE'
                    ? 'border-emerald-400 hover:border-emerald-500 bg-emerald-50/20'
                    : 'border-slate-300 hover:border-indigo-300'
                }`}
                title="Group Table 1 (2 Desks) - Click to reserve entire table"
              >
                <div className="text-center mb-1">
                  <div className="w-5 h-5 rounded-full bg-indigo-600 text-white font-black text-[10px] flex items-center justify-center mx-auto mb-0.5">
                    1
                  </div>
                  <span className="text-[10px] font-extrabold text-slate-900 block leading-tight">
                    Group Table 1
                  </span>
                  <span className="text-[8px] font-bold text-indigo-700 bg-indigo-100/70 px-1.5 py-0.2 rounded-full inline-block mt-0.5">
                    2 Desks Block
                  </span>
                </div>

                {/* 2 Desks Inside Circle */}
                <div className="flex gap-1.5">
                  {groupTable1Seats.map((seat) => {
                    const colors = getSeatColor(seat.status);
                    const isSelected = selectedSeat?.id === seat.id;
                    return (
                      <button
                        key={seat.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectSeat(seat);
                        }}
                        className={`w-8 h-8 rounded-lg border text-[9px] font-bold flex flex-col items-center justify-center transition-all cursor-pointer ${colors.bg} ${colors.border} ${colors.text} ${
                          isSelected || isGroupTableSelected(1) ? 'ring-2 ring-indigo-600 scale-105' : ''
                        }`}
                        title={`${seat.seatCode} (${seat.status})`}
                      >
                        <span>{seat.seatCode.replace('SEAT-GT1-', 'D')}</span>
                        <span className={`w-1 h-1 rounded-full ${colors.indicator}`} />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* GROUP TABLE 2 (Vertical Oval in diagram, 9 Desks, Spans Tall on Right) */}
            <div
              className={`col-span-2 row-span-2 flex flex-col items-center ${
                filterMode === 'INDIVIDUAL' ? 'opacity-40' : ''
              }`}
            >
              <div
                onClick={() => handleGroupTableClick(groupTable2Seats)}
                className={`w-36 h-[290px] rounded-[48px] border-2 p-3 flex flex-col items-center justify-between cursor-pointer transition-all shadow-xs relative bg-white ${
                  isGroupTableSelected(2)
                    ? 'border-indigo-600 ring-4 ring-indigo-500/20 bg-indigo-50/40 scale-102'
                    : getGroupTableStatus(groupTable2Seats) === 'AVAILABLE'
                    ? 'border-emerald-400 hover:border-emerald-500 bg-emerald-50/20'
                    : 'border-slate-300 hover:border-indigo-300'
                }`}
                title="Group Table 2 (9 Desks) - Click to reserve entire table"
              >
                {/* Oval Header */}
                <div className="text-center pt-1">
                  <div className="w-5 h-5 rounded-full bg-indigo-600 text-white font-black text-[10px] flex items-center justify-center mx-auto mb-0.5">
                    2
                  </div>
                  <span className="text-[11px] font-extrabold text-slate-900 block leading-tight">
                    Group Table 2
                  </span>
                  <span className="text-[8px] font-bold text-indigo-700 bg-indigo-100/70 px-1.5 py-0.2 rounded-full inline-block mt-0.5">
                    9 Desks Oval
                  </span>
                </div>

                {/* 9 Desks Arranged in Vertical Oval Pattern */}
                <div className="grid grid-cols-2 gap-1.5 py-1">
                  {groupTable2Seats.map((seat, index) => {
                    const colors = getSeatColor(seat.status);
                    const isSelected = selectedSeat?.id === seat.id;
                    const isCenterLast = index === 8;
                    return (
                      <button
                        key={seat.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectSeat(seat);
                        }}
                        className={`${
                          isCenterLast ? 'col-span-2 mx-auto w-10' : 'w-11'
                        } h-8 rounded-lg border text-[9px] font-bold flex flex-col items-center justify-center transition-all cursor-pointer ${colors.bg} ${colors.border} ${colors.text} ${
                          isSelected || isGroupTableSelected(2) ? 'ring-2 ring-indigo-600 scale-105' : ''
                        }`}
                        title={`${seat.seatCode} (${seat.status})`}
                      >
                        <span>{seat.seatCode.replace('SEAT-GT2-', 'D')}</span>
                        <span className={`w-1 h-1 rounded-full ${colors.indicator}`} />
                      </button>
                    );
                  })}
                </div>

                <div className="text-[8px] font-mono text-slate-400 pb-1">
                  {groupTable2Seats.filter((s) => s.status === 'AVAILABLE').length}/9 free
                </div>
              </div>
            </div>

          </div>

          {/* ============================================================================== */}
          {/* ROW 2: GROUP TABLE 3 (Circle, Left), STATION C, STATION D, STATION E (Middle) */}
          {/* ============================================================================== */}
          <div className="grid grid-cols-12 gap-4 items-center">
            
            {/* GROUP TABLE 3 (Circle in diagram, 4 Desks, Middle Left) */}
            <div
              className={`col-span-3 flex flex-col items-start ${
                filterMode === 'INDIVIDUAL' ? 'opacity-40' : ''
              }`}
            >
              <div
                onClick={() => handleGroupTableClick(groupTable3Seats)}
                className={`w-36 h-36 rounded-full border-2 p-3 flex flex-col items-center justify-center cursor-pointer transition-all shadow-xs relative bg-white ${
                  isGroupTableSelected(3)
                    ? 'border-indigo-600 ring-4 ring-indigo-500/20 bg-indigo-50/40 scale-105'
                    : getGroupTableStatus(groupTable3Seats) === 'AVAILABLE'
                    ? 'border-emerald-400 hover:border-emerald-500 bg-emerald-50/20'
                    : 'border-slate-300 hover:border-indigo-300'
                }`}
                title="Group Table 3 (4 Desks) - Click to reserve entire table"
              >
                <div className="text-center mb-1">
                  <div className="w-5 h-5 rounded-full bg-indigo-600 text-white font-black text-[10px] flex items-center justify-center mx-auto mb-0.5">
                    3
                  </div>
                  <span className="text-[10px] font-extrabold text-slate-900 block leading-tight">
                    Group Table 3
                  </span>
                  <span className="text-[8px] font-bold text-indigo-700 bg-indigo-100/70 px-1.5 py-0.2 rounded-full inline-block mt-0.5">
                    4 Desks Circle
                  </span>
                </div>

                {/* 2x2 Desks Inside Circle */}
                <div className="grid grid-cols-2 gap-1.5">
                  {groupTable3Seats.map((seat) => {
                    const colors = getSeatColor(seat.status);
                    const isSelected = selectedSeat?.id === seat.id;
                    return (
                      <button
                        key={seat.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectSeat(seat);
                        }}
                        className={`w-9 h-8 rounded-lg border text-[9px] font-bold flex flex-col items-center justify-center transition-all cursor-pointer ${colors.bg} ${colors.border} ${colors.text} ${
                          isSelected || isGroupTableSelected(3) ? 'ring-2 ring-indigo-600 scale-105' : ''
                        }`}
                        title={`${seat.seatCode} (${seat.status})`}
                      >
                        <span>{seat.seatCode.replace('SEAT-GT3-', 'D')}</span>
                        <span className={`w-1 h-1 rounded-full ${colors.indicator}`} />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* STATION C (Rounded Square in diagram, 4 Desks, Individual) */}
            <div
              className={`col-span-2.5 p-3 rounded-2xl border-2 transition-all bg-white shadow-xs ${
                filterMode === 'GROUP' ? 'opacity-40' : ''
              } ${
                stationCSeats.some((s) => selectedSeat?.id === s.id)
                  ? 'border-blue-600 ring-2 ring-blue-500/20 shadow-md'
                  : 'border-slate-300 hover:border-slate-400'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5 pb-1 border-b border-slate-100">
                <div className="flex items-center gap-1">
                  <span className="w-4.5 h-4.5 rounded-md bg-blue-100 text-blue-700 font-extrabold text-[10px] flex items-center justify-center">
                    C
                  </span>
                  <span className="text-[11px] font-extrabold text-slate-900">Station C</span>
                </div>
                <span className="text-[9px] font-semibold text-slate-500">4 Desks</span>
              </div>

              {/* 2x2 Grid of Desks (C1-C4) */}
              <div className="grid grid-cols-2 gap-1.5">
                {stationCSeats.map((seat) => {
                  const colors = getSeatColor(seat.status);
                  const isSelected = selectedSeat?.id === seat.id;
                  return (
                    <button
                      key={seat.id}
                      onClick={() => onSelectSeat(seat)}
                      className={`flex flex-col items-center justify-between p-1 rounded-xl border transition-all cursor-pointer select-none min-h-[44px] shadow-2xs ${colors.bg} ${colors.border} ${
                        isSelected ? 'ring-2 ring-blue-600 scale-105 z-10 shadow-sm' : 'hover:scale-102 active:scale-95'
                      }`}
                      title={`${seat.seatCode} (${seat.status}) - Single Desk`}
                    >
                      <div className="w-full flex items-center justify-between px-0.5">
                        <span className={`text-[10px] font-bold ${colors.text}`}>
                          {seat.seatCode.replace('SEAT-', '')}
                        </span>
                        <span className={`w-1.5 h-1.5 rounded-full ${colors.indicator}`} />
                      </div>
                      <div className="w-5 h-1.5 bg-slate-300 rounded-2xs my-0.5" />
                      <span className="text-[8px] font-mono text-slate-500 font-medium">{colors.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* STATION D (Rounded Square in diagram, 2 Desks, Individual) */}
            <div
              className={`col-span-2 p-3 rounded-2xl border-2 transition-all bg-white shadow-xs ${
                filterMode === 'GROUP' ? 'opacity-40' : ''
              } ${
                stationDSeats.some((s) => selectedSeat?.id === s.id)
                  ? 'border-blue-600 ring-2 ring-blue-500/20 shadow-md'
                  : 'border-slate-300 hover:border-slate-400'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5 pb-1 border-b border-slate-100">
                <div className="flex items-center gap-1">
                  <span className="w-4.5 h-4.5 rounded-md bg-blue-100 text-blue-700 font-extrabold text-[10px] flex items-center justify-center">
                    D
                  </span>
                  <span className="text-[11px] font-extrabold text-slate-900">Station D</span>
                </div>
                <span className="text-[9px] font-semibold text-slate-500">2 Desks</span>
              </div>

              {/* 2 Desks (D1, D2) */}
              <div className="flex flex-col gap-1.5">
                {stationDSeats.map((seat) => {
                  const colors = getSeatColor(seat.status);
                  const isSelected = selectedSeat?.id === seat.id;
                  return (
                    <button
                      key={seat.id}
                      onClick={() => onSelectSeat(seat)}
                      className={`flex items-center justify-between p-1.5 rounded-xl border transition-all cursor-pointer select-none shadow-2xs ${colors.bg} ${colors.border} ${
                        isSelected ? 'ring-2 ring-blue-600 scale-102 z-10 shadow-sm' : 'hover:scale-101 active:scale-95'
                      }`}
                      title={`${seat.seatCode} (${seat.status}) - Single Desk`}
                    >
                      <span className={`text-[10px] font-bold ${colors.text}`}>
                        {seat.seatCode.replace('SEAT-', '')}
                      </span>
                      <div className="w-5 h-1.5 bg-slate-300 rounded-2xs" />
                      <span className="text-[8px] font-mono text-slate-500 font-medium">{colors.label}</span>
                      <span className={`w-1.5 h-1.5 rounded-full ${colors.indicator}`} />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* STATION E (Rounded Square in diagram, 4 Desks, Individual) */}
            <div
              className={`col-span-2.5 p-3 rounded-2xl border-2 transition-all bg-white shadow-xs ${
                filterMode === 'GROUP' ? 'opacity-40' : ''
              } ${
                stationESeats.some((s) => selectedSeat?.id === s.id)
                  ? 'border-blue-600 ring-2 ring-blue-500/20 shadow-md'
                  : 'border-slate-300 hover:border-slate-400'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5 pb-1 border-b border-slate-100">
                <div className="flex items-center gap-1">
                  <span className="w-4.5 h-4.5 rounded-md bg-blue-100 text-blue-700 font-extrabold text-[10px] flex items-center justify-center">
                    E
                  </span>
                  <span className="text-[11px] font-extrabold text-slate-900">Station E</span>
                </div>
                <span className="text-[9px] font-semibold text-slate-500">4 Desks</span>
              </div>

              {/* 2x2 Grid of Desks (E1-E4) */}
              <div className="grid grid-cols-2 gap-1.5">
                {stationESeats.map((seat) => {
                  const colors = getSeatColor(seat.status);
                  const isSelected = selectedSeat?.id === seat.id;
                  return (
                    <button
                      key={seat.id}
                      onClick={() => onSelectSeat(seat)}
                      className={`flex flex-col items-center justify-between p-1 rounded-xl border transition-all cursor-pointer select-none min-h-[44px] shadow-2xs ${colors.bg} ${colors.border} ${
                        isSelected ? 'ring-2 ring-blue-600 scale-105 z-10 shadow-sm' : 'hover:scale-102 active:scale-95'
                      }`}
                      title={`${seat.seatCode} (${seat.status}) - Single Desk`}
                    >
                      <div className="w-full flex items-center justify-between px-0.5">
                        <span className={`text-[10px] font-bold ${colors.text}`}>
                          {seat.seatCode.replace('SEAT-', '')}
                        </span>
                        <span className={`w-1.5 h-1.5 rounded-full ${colors.indicator}`} />
                      </div>
                      <div className="w-5 h-1.5 bg-slate-300 rounded-2xs my-0.5" />
                      <span className="text-[8px] font-mono text-slate-500 font-medium">{colors.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Spacer for Row 2 right column aligning with Group Table 2 */}
            <div className="col-span-2 hidden lg:block" />

          </div>

          {/* ============================================================================== */}
          {/* ROW 3: GROUP TABLE 5 (Wide Horizontal Oval, Left), WALKWAY (Center), GROUP TABLE 4 (Vertical Oval, Right) */}
          {/* ============================================================================== */}
          <div className="grid grid-cols-12 gap-4 items-end pt-2">
            
            {/* GROUP TABLE 5 (Wide Horizontal Oval in diagram, 8 Desks, Group Booking) */}
            <div
              className={`col-span-7 ${
                filterMode === 'INDIVIDUAL' ? 'opacity-40' : ''
              }`}
            >
              <div
                onClick={() => handleGroupTableClick(groupTable5Seats)}
                className={`w-full max-w-lg h-36 rounded-[56px] border-2 p-3.5 flex flex-col items-center justify-between cursor-pointer transition-all shadow-xs relative bg-white ${
                  isGroupTableSelected(5)
                    ? 'border-indigo-600 ring-4 ring-indigo-500/20 bg-indigo-50/40 scale-102'
                    : getGroupTableStatus(groupTable5Seats) === 'AVAILABLE'
                    ? 'border-emerald-400 hover:border-emerald-500 bg-emerald-50/20'
                    : 'border-slate-300 hover:border-indigo-300'
                }`}
                title="Group Table 5 (8 Desks) - Click to reserve entire table"
              >
                {/* Horizontal Oval Header */}
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-indigo-600 text-white font-black text-[10px] flex items-center justify-center">
                    5
                  </div>
                  <span className="text-xs font-extrabold text-slate-900 tracking-tight">
                    Group Table 5
                  </span>
                  <span className="text-[9px] font-bold text-indigo-700 bg-indigo-100/70 px-2 py-0.5 rounded-full">
                    8 Desks Horizontal Oval (Team Block)
                  </span>
                </div>

                {/* 8 Desks inside the Horizontal Oval (4 x 2) */}
                <div className="grid grid-cols-4 gap-2 w-full max-w-md px-4">
                  {groupTable5Seats.map((seat) => {
                    const colors = getSeatColor(seat.status);
                    const isSelected = selectedSeat?.id === seat.id;
                    return (
                      <button
                        key={seat.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectSeat(seat);
                        }}
                        className={`h-8 rounded-lg border text-[9px] font-bold flex flex-col items-center justify-center transition-all cursor-pointer ${colors.bg} ${colors.border} ${colors.text} ${
                          isSelected || isGroupTableSelected(5) ? 'ring-2 ring-indigo-600 scale-105' : ''
                        }`}
                        title={`${seat.seatCode} (${seat.status})`}
                      >
                        <span>{seat.seatCode.replace('SEAT-GT5-', 'D')}</span>
                        <span className={`w-1 h-1 rounded-full ${colors.indicator}`} />
                      </button>
                    );
                  })}
                </div>

                <div className="text-[8px] font-mono text-slate-400">
                  {groupTable5Seats.filter((s) => s.status === 'AVAILABLE').length}/8 desks available
                </div>
              </div>
            </div>

            {/* Center Main Laboratory Entrance / Walkway Indicator */}
            <div className="col-span-3 flex flex-col items-center justify-center text-slate-400 text-[10px] font-mono tracking-widest pb-6 select-none">
              <span className="text-base mb-1">🚪</span>
              <span>MAIN ENTRANCE & WALKWAY</span>
            </div>

            {/* GROUP TABLE 4 (Vertical Oval in diagram, 9 Desks, Bottom Right) */}
            <div
              className={`col-span-2 flex flex-col items-center ${
                filterMode === 'INDIVIDUAL' ? 'opacity-40' : ''
              }`}
            >
              <div
                onClick={() => handleGroupTableClick(groupTable4Seats)}
                className={`w-36 h-[290px] rounded-[48px] border-2 p-3 flex flex-col items-center justify-between cursor-pointer transition-all shadow-xs relative bg-white ${
                  isGroupTableSelected(4)
                    ? 'border-indigo-600 ring-4 ring-indigo-500/20 bg-indigo-50/40 scale-102'
                    : getGroupTableStatus(groupTable4Seats) === 'AVAILABLE'
                    ? 'border-emerald-400 hover:border-emerald-500 bg-emerald-50/20'
                    : 'border-slate-300 hover:border-indigo-300'
                }`}
                title="Group Table 4 (9 Desks) - Click to reserve entire table"
              >
                {/* Oval Header */}
                <div className="text-center pt-1">
                  <div className="w-5 h-5 rounded-full bg-indigo-600 text-white font-black text-[10px] flex items-center justify-center mx-auto mb-0.5">
                    4
                  </div>
                  <span className="text-[11px] font-extrabold text-slate-900 block leading-tight">
                    Group Table 4
                  </span>
                  <span className="text-[8px] font-bold text-indigo-700 bg-indigo-100/70 px-1.5 py-0.2 rounded-full inline-block mt-0.5">
                    9 Desks Oval
                  </span>
                </div>

                {/* 9 Desks inside Vertical Oval */}
                <div className="grid grid-cols-2 gap-1.5 py-1">
                  {groupTable4Seats.map((seat, index) => {
                    const colors = getSeatColor(seat.status);
                    const isSelected = selectedSeat?.id === seat.id;
                    const isCenterLast = index === 8;
                    return (
                      <button
                        key={seat.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectSeat(seat);
                        }}
                        className={`${
                          isCenterLast ? 'col-span-2 mx-auto w-10' : 'w-11'
                        } h-8 rounded-lg border text-[9px] font-bold flex flex-col items-center justify-center transition-all cursor-pointer ${colors.bg} ${colors.border} ${colors.text} ${
                          isSelected || isGroupTableSelected(4) ? 'ring-2 ring-indigo-600 scale-105' : ''
                        }`}
                        title={`${seat.seatCode} (${seat.status})`}
                      >
                        <span>{seat.seatCode.replace('SEAT-GT4-', 'D')}</span>
                        <span className={`w-1 h-1 rounded-full ${colors.indicator}`} />
                      </button>
                    );
                  })}
                </div>

                <div className="text-[8px] font-mono text-slate-400 pb-1">
                  {groupTable4Seats.filter((s) => s.status === 'AVAILABLE').length}/9 free
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* Bottom Helper Bar */}
        <div className="mt-4 pt-3 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <span>
            💡 Tap any desk in <strong>Stations A–E</strong> to reserve a single seat, or tap any <strong>Group Table (1–5)</strong> to reserve the entire table block.
          </span>
          <span className="text-[11px] font-medium text-slate-600 font-mono">SE Lab 101 Layout (54 Desks Total)</span>
        </div>
      </div>
    </div>
  );
};
