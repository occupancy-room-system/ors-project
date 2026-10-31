import React, { useState } from 'react';
import { Seat, User } from '@/types';

interface SeatDetailModalProps {
  seat: Seat | null;
  onClose: () => void;
  currentUser: User | null;
  onOpenLogin: () => void;
  onConfirmReservation: (params: { seatId: number; startTime: string; durationHours: number }) => Promise<void>;
  onToggleMaintenance?: (seat: Seat) => void;
  onNavigateToCheckIn?: () => void;
}

export const SeatDetailModal: React.FC<SeatDetailModalProps> = ({
  seat,
  onClose,
  currentUser,
  onOpenLogin,
  onConfirmReservation,
  onToggleMaintenance,
  onNavigateToCheckIn,
}) => {
  const [durationHours, setDurationHours] = useState<number>(2);
  const [arrivalOffsetMinutes, setArrivalOffsetMinutes] = useState<number>(0);
  const [customTime, setCustomTime] = useState<string>('');
  const [useCustomTime, setUseCustomTime] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!seat) return null;

  const now = new Date();
  const maxAdvanceMinutes = 60; // strictly maximum 1 hour ahead
  const isAvailable = seat.status === 'AVAILABLE';
  const isReservedByCurrentUser = currentUser && seat.currentReservation && seat.currentReservation.userId === currentUser.id;

  // Format nice local time string HH:MM AM/PM
  const formatTime = (d: Date) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Calculate actual requested start time
  const getCalculatedStartTime = (): Date => {
    if (useCustomTime && customTime) {
      const [h, m] = customTime.split(':').map(Number);
      const d = new Date();
      d.setHours(h, m, 0, 0);
      return d;
    }
    return new Date(Date.now() + arrivalOffsetMinutes * 60000);
  };

  const selectedStartTime = getCalculatedStartTime();
  const diffMinutesFromNow = Math.round((selectedStartTime.getTime() - Date.now()) / 60000);
  const isTimeBeyondOneHour = diffMinutesFromNow > maxAdvanceMinutes;
  const isTimeInPast = diffMinutesFromNow < -5;

  const maxAllowedTime = new Date(Date.now() + maxAdvanceMinutes * 60000);

  const handleReservationSubmit = async () => {
    setErrorMsg(null);
    if (!currentUser) {
      onOpenLogin();
      return;
    }

    if (isTimeBeyondOneHour) {
      setErrorMsg(`Policy Restriction: Current time is ${formatTime(now)}. Reservations can only be made for arrival within 1 hour (until ${formatTime(maxAllowedTime)}). You cannot reserve for a later time (e.g., at 10 AM you cannot reserve for 1 PM).`);
      return;
    }

    if (isTimeInPast) {
      setErrorMsg('Reservation arrival time cannot be in the past.');
      return;
    }

    setSubmitting(true);
    try {
      await onConfirmReservation({
        seatId: seat.id,
        startTime: selectedStartTime.toISOString(),
        durationHours,
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to complete reservation.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/50 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[90vh]">
        
        {/* Mobile Drag Indicator */}
        <div className="w-12 h-1 bg-slate-300 rounded-full mx-auto mt-2.5 mb-1 sm:hidden shrink-0" />

        {/* Header */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                seat.tableType === 'GROUP' ? 'bg-indigo-100 text-indigo-800' : 'bg-blue-100 text-blue-800'
              }`}>
                {seat.tableType === 'GROUP' ? 'Group Collaboration Table' : 'Individual Workstation'}
              </span>
              <span className="text-xs text-slate-500 font-medium">{seat.podLabel}</span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 mt-0.5">
              {seat.tableType === 'GROUP' ? `${seat.podLabel} (${seat.groupCapacity} Desks)` : `Workstation ${seat.seatCode}`}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg transition-colors cursor-pointer text-base font-bold"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto flex-1">
          
          {/* Status Indicator Bar */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-xs font-semibold text-slate-600">Workstation Status:</span>
            <div className="flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  seat.status === 'AVAILABLE' ? 'bg-emerald-500' :
                  seat.status === 'RESERVED' ? 'bg-indigo-500' :
                  seat.status === 'OCCUPIED' ? 'bg-rose-500' :
                  seat.status === 'EXPIRING_SOON' ? 'bg-amber-500' : 'bg-slate-400'
                }`}
              />
              <span className="text-xs font-bold text-slate-900">{seat.status}</span>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs leading-relaxed">
              <strong>Error:</strong> {errorMsg}
            </div>
          )}

          {/* CASE 1: SEAT IS OCCUPIED */}
          {seat.status === 'OCCUPIED' || seat.status === 'EXPIRING_SOON' ? (
            <div className="p-4 rounded-xl bg-rose-50/70 border border-rose-200 text-xs space-y-2">
              <div className="font-bold text-rose-900 flex items-center gap-1.5">
                <span>⚠️</span>
                <span>Workstation Currently In Use</span>
              </div>
              <p className="text-rose-800">
                A student is currently checked in at this desk.
                {seat.currentSession && (
                  <span className="block mt-1 font-mono font-medium">
                    Remaining time: {seat.currentSession.minutesRemaining} minutes (Scheduled expiry: {new Date(seat.currentSession.expiresAt).toLocaleTimeString()})
                  </span>
                )}
              </p>
              <p className="text-slate-500 text-[11px] pt-1 border-t border-rose-200/60">
                This seat cannot be reserved until the current student checks out or their session finishes.
              </p>
            </div>
          ) : null}

          {/* CASE 2: SEAT IS RESERVED */}
          {seat.status === 'RESERVED' ? (
            <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-200 text-xs space-y-2">
              <div className="font-bold text-indigo-950 flex items-center gap-1.5">
                <span>📌</span>
                <span>Workstation Held by Reservation</span>
              </div>
              {isReservedByCurrentUser ? (
                <div>
                  <p className="text-indigo-800 font-medium leading-relaxed">
                    You have reserved this seat! When you arrive at SE Lab 101, open <strong>QR Check-In</strong> and scan the physical QR sticker on the desk to activate your session.
                  </p>
                  <button
                    onClick={() => {
                      onClose();
                      if (onNavigateToCheckIn) onNavigateToCheckIn();
                    }}
                    className="mt-3 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors cursor-pointer"
                  >
                    Go to QR Check-In / Activation →
                  </button>
                </div>
              ) : (
                <p className="text-indigo-800 leading-relaxed">
                  This desk is currently held under reservation for another student. If they do not activate it at the physical desk within 20 minutes of arrival, the seat will automatically become free.
                </p>
              )}
            </div>
          ) : null}

          {/* CASE 3: SEAT IS AVAILABLE -> RESERVATION FLOW */}
          {isAvailable ? (
            <div>
              {/* Authentication Validation Guard */}
              {!currentUser ? (
                <div className="p-5 rounded-xl bg-blue-50/70 border border-blue-200 text-center space-y-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold text-base flex items-center justify-center mx-auto">
                    🔒
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Sign In Required to Reserve Workstation</h4>
                    <p className="text-xs text-slate-600 mt-1 max-w-sm mx-auto">
                      Only verified students can reserve a seat before arriving. Please sign in to link your account.
                    </p>
                  </div>
                  <div className="pt-1">
                    <button
                      onClick={onOpenLogin}
                      className="px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors cursor-pointer"
                    >
                      Sign In with Student Account
                    </button>
                  </div>
                </div>
              ) : (
                /* Authenticated Reservation Form (NO QR CODE SHOWN HERE!) */
                <div className="space-y-4">
                  {/* User Profile confirmation with login data */}
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-center justify-between">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Reserving As:</span>
                      <span className="font-bold text-slate-900 text-sm">{currentUser.fullName}</span>
                      <span className="text-slate-500 font-mono block text-[11px]">{currentUser.email}</span>
                    </div>
                    <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-1 rounded-md border border-emerald-200">
                      ✓ Verified Student
                    </span>
                  </div>

                  {/* Group Table vs Single Desk Rule Notice */}
                  {seat.tableType === 'GROUP' ? (
                    <div className="p-3.5 rounded-xl bg-indigo-50 border border-indigo-200 text-xs text-indigo-950 space-y-1">
                      <div className="font-bold flex items-center gap-1.5">
                        <span>👥</span>
                        <span>Group Table Booking Rule</span>
                      </div>
                      <p className="text-[11px] text-indigo-900 leading-relaxed">
                        You are reserving <strong>{seat.podLabel}</strong>. Reserving this table automatically blocks and reserves <strong>all {seat.groupCapacity} desks</strong> for your team.
                      </p>
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
                      <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                        <span>🪑</span>
                        <span>Individual Desk Reservation</span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        One student reservation for desk {seat.seatCode.replace('SEAT-', '')} in {seat.podLabel}.
                      </p>
                    </div>
                  )}

                  {/* 1. Duration Selection: Adjust time Min 1h to Max 4h */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Session Duration (Min 1h – Max 4h)
                      </label>
                      <span className="text-xs font-bold text-blue-600 font-mono">
                        {durationHours} {durationHours === 1 ? 'Hour' : 'Hours'}
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {[1, 2, 3, 4].map((hr) => (
                        <button
                          key={hr}
                          type="button"
                          onClick={() => setDurationHours(hr)}
                          className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                            durationHours === hr
                              ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                              : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {hr} {hr === 1 ? 'Hour' : 'Hours'}
                        </button>
                      ))}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      *You can adjust your laboratory work duration between 1 to 4 hours.
                    </p>
                  </div>

                  {/* 2. Arrival / Start Time: Strictly Limited to Within 1 Hour */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Planned Arrival Time (Max 1h Limit)
                      </label>
                      <span className="text-xs font-mono font-bold text-slate-800 tabular-nums">
                        {formatTime(selectedStartTime)}
                      </span>
                    </div>

                    {/* Live Clock Display & Policy Window */}
                    <div className="p-2.5 rounded-lg bg-slate-100/80 border border-slate-200 text-[11px] mb-2 flex items-center justify-between">
                      <span className="text-slate-600">
                        Current Time: <strong className="font-mono">{formatTime(now)}</strong>
                      </span>
                      <span className="text-blue-700 font-medium">
                        Allowed Window: <strong className="font-mono">{formatTime(now)} – {formatTime(maxAllowedTime)}</strong>
                      </span>
                    </div>

                    {/* Quick Arrival Preset Buttons */}
                    <div className="grid grid-cols-3 gap-2 mb-2">
                      <button
                        type="button"
                        onClick={() => {
                          setUseCustomTime(false);
                          setArrivalOffsetMinutes(0);
                        }}
                        className={`py-2 px-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                          !useCustomTime && arrivalOffsetMinutes === 0
                            ? 'bg-blue-50 border-blue-600 text-blue-900 font-bold shadow-2xs'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        Right Now ({formatTime(now)})
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setUseCustomTime(false);
                          setArrivalOffsetMinutes(15);
                        }}
                        className={`py-2 px-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                          !useCustomTime && arrivalOffsetMinutes === 15
                            ? 'bg-blue-50 border-blue-600 text-blue-900 font-bold shadow-2xs'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        +15 Mins
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setUseCustomTime(false);
                          setArrivalOffsetMinutes(30);
                        }}
                        className={`py-2 px-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                          !useCustomTime && arrivalOffsetMinutes === 30
                            ? 'bg-blue-50 border-blue-600 text-blue-900 font-bold shadow-2xs'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        +30 Mins
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setUseCustomTime(false);
                          setArrivalOffsetMinutes(45);
                        }}
                        className={`py-2 px-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                          !useCustomTime && arrivalOffsetMinutes === 45
                            ? 'bg-blue-50 border-blue-600 text-blue-900 font-bold shadow-2xs'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        +45 Mins
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setUseCustomTime(false);
                          setArrivalOffsetMinutes(60);
                        }}
                        className={`py-2 px-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                          !useCustomTime && arrivalOffsetMinutes === 60
                            ? 'bg-blue-50 border-blue-600 text-blue-900 font-bold shadow-2xs'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        +1 Hour (Max Allowed)
                      </button>
                    </div>

                    {/* Custom Time Selector */}
                    <div className="mt-2.5 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                      <label className="text-[11px] font-semibold text-slate-600">
                        Or Pick Specific Arrival Time:
                      </label>
                      <input
                        type="time"
                        value={customTime}
                        onChange={(e) => {
                          setCustomTime(e.target.value);
                          setUseCustomTime(true);
                        }}
                        className="px-2 py-1 border border-slate-300 rounded-md text-xs font-mono"
                      />
                    </div>

                    {/* Active Validation Warning If Beyond 1 Hour */}
                    {isTimeBeyondOneHour && (
                      <div className="mt-2.5 p-3 rounded-lg bg-rose-50 border border-rose-300 text-xs text-rose-900 space-y-1">
                        <strong className="block font-bold">⚠️ Reservation Blocked by Lab Policy:</strong>
                        <p className="leading-relaxed">
                          You selected <strong>{formatTime(selectedStartTime)}</strong>, but the current time is <strong>{formatTime(now)}</strong> (+{diffMinutesFromNow} minutes ahead).
                        </p>
                        <p className="text-[11px] text-rose-800">
                          To keep workstations open for active students on campus, reservations are strictly limited to arrival within <strong>1 hour</strong> (up to {formatTime(maxAllowedTime)}). Long-advance bookings (e.g. at 10 AM for 1 PM) are prohibited.
                        </p>
                      </div>
                    )}

                    {!isTimeBeyondOneHour && (
                      <div className="mt-2.5 p-2.5 rounded-lg bg-blue-50/70 border border-blue-200 text-[11px] text-blue-900 leading-normal">
                        <strong>Policy:</strong> Workstations can only be reserved for arrival within 1 hour of current time. This ensures desks remain open for students currently travelling to the lab.
                      </div>
                    )}
                  </div>

                  {/* Explicit Explanation: NO QR CODE IS SHOWN HERE */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 flex items-start gap-2">
                    <span className="text-base">ℹ️</span>
                    <div>
                      <span className="font-bold text-slate-800 block">Next Step After Reserving:</span>
                      <span>This reservation will be held for your arrival. Once you reach desk {seat.seatCode} in SE Lab 101, open <strong>QR Check-In</strong> to scan the physical desk QR sticker and start your session.</span>
                    </div>
                  </div>

                  {/* Confirm Action Button */}
                  <div className="pt-2">
                    <button
                      onClick={handleReservationSubmit}
                      disabled={submitting || isTimeBeyondOneHour || isTimeInPast}
                      className="w-full py-3 px-4 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-xs transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitting ? 'Confirming Reservation...' : `Confirm Reservation for ${seat.seatCode} (${durationHours}h)`}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : null}

          {/* Admin Controls */}
          {currentUser?.role === 'ADMINISTRATOR' && onToggleMaintenance && (
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600">Admin Maintenance Override:</span>
              <button
                onClick={() => onToggleMaintenance(seat)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg cursor-pointer"
              >
                {seat.status === 'MAINTENANCE' ? 'Mark Available' : 'Set Under Maintenance'}
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Physical QR sticker on desk activates session upon arrival</span>
          <button
            onClick={onClose}
            className="font-semibold text-slate-700 hover:text-slate-900 cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
