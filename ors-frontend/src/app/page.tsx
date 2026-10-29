'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from '../components/layout/Navbar';
import { RoomMap2D } from '../components/room-map/RoomMap2D';
import { SeatDetailModal } from '../components/room-map/SeatDetailModal';
import { ActiveSessionCard } from '../components/session/ActiveSessionCard';
import { QrCheckInModal } from '../components/session/QrCheckInModal';
import { AdminDashboard } from '../components/admin/AdminDashboard';
import { AuthModal } from '../components/auth/AuthModal';
import { ApiClient } from '../lib/api-client';
import { DEFAULT_MAP_DATA, DEFAULT_HEALTH } from '../lib/mock-data';
import { User, OccupancyMapResponse, OccupancySession, Seat, HealthStatus, Reservation } from '../types';

// Pre-seeded Demo Users
const DEMO_STUDENT: User = {
  id: 2,
  fullName: 'Alex Chen',
  email: 'alex.chen@student.university.edu',
  role: 'STUDENT',
  accountStatus: 'ACTIVE',
};

export default function App() {
  const [currentTab, setCurrentTab] = useState<'map' | 'checkin' | 'session' | 'history' | 'admin'>('map');
  const [currentUser, setCurrentUser] = useState<User | null>(DEMO_STUDENT);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalPortal, setAuthModalPortal] = useState<'student' | 'admin'>('student');
  const [roomData, setRoomData] = useState<OccupancyMapResponse>(DEFAULT_MAP_DATA);
  const [activeSession, setActiveSession] = useState<OccupancySession | null>(null);
  const [userReservations, setUserReservations] = useState<Reservation[]>([]);
  const [sessionHistory, setSessionHistory] = useState<OccupancySession[]>([]);
  const [selectedSeat, setSelectedSeat] = useState<Seat | null>(null);
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(DEFAULT_HEALTH);
  const [loading, setLoading] = useState<boolean>(false);
  const [backendOnline, setBackendOnline] = useState<boolean>(false);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 5000);
  };

  // Fetch live state from backend
  const loadData = useCallback(async () => {
    try {
      const [mapRes, healthRes] = await Promise.all([
        ApiClient.getRoomMap(1),
        ApiClient.getHealth(),
      ]);
      setRoomData(mapRes);
      setHealthStatus(healthRes);
      setBackendOnline(true);

      if (currentUser) {
        const [activeRes, historyRes, resList] = await Promise.all([
          ApiClient.getActiveSession(currentUser.id),
          ApiClient.getSessionHistory(currentUser.id),
          ApiClient.getUserReservations(currentUser.id),
        ]);
        setActiveSession(activeRes);
        setSessionHistory(historyRes);
        setUserReservations(resList);
      } else {
        setActiveSession(null);
        setSessionHistory([]);
        setUserReservations([]);
      }
    } catch (err: any) {
      // Backend may be offline or still starting up
      setBackendOnline(false);
      console.warn('Backend connection notice (http://localhost:8080):', err.message || err);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  // Initial load + 10s live polling
  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, [loadData]);

  // Deep-link scan detection from physical QR sticker URL
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const scanCode = params.get('scan') || params.get('seatId');
    const token = params.get('token') || '';

    if (scanCode && roomData && currentUser) {
      setCurrentTab('checkin');
      showToast(`Scanned physical desk QR sticker for ${scanCode}. Verifying with server...`, 'info');
      // Clean up URL parameter cleanly
      window.history.replaceState({}, document.title, window.location.pathname);

      ApiClient.activateSeatWithQr({
        seatCode: scanCode,
        qrToken: token,
        userId: currentUser.id,
      })
        .then((session) => {
          showToast(`Welcome to ${session.seatCode}! Session activated for ${session.durationMinutes} mins.`, 'success');
          loadData();
          setCurrentTab('session');
        })
        .catch((err) => {
          showToast(err.message || `Workstation ${scanCode} is currently UNAVAILABLE.`, 'error');
        });
    }
  }, [roomData, currentUser, loadData]);

  // Handle User Login
  const handleLogin = (user: User) => {
    setCurrentUser(user);
    showToast(`Signed in as ${user.fullName} (${user.role})`, 'success');
    if (user.role === 'ADMINISTRATOR') {
      setCurrentTab('admin');
    } else if (currentTab === 'admin') {
      setCurrentTab('map');
    }
  };

  // Handle User Logout
  const handleLogout = () => {
    setCurrentUser(null);
    if (currentTab === 'admin') {
      setCurrentTab('map');
    }
    showToast('Signed out of laboratory session.', 'info');
  };

  // Handle Confirming Seat Reservation
  const handleConfirmReservation = async (params: { seatId: number; startTime: string; durationHours: number }) => {
    if (!currentUser) {
      setAuthModalPortal('student');
      setIsAuthModalOpen(true);
      return;
    }
    setActionLoading(true);
    try {
      const res = await ApiClient.createReservation({
        userId: currentUser.id,
        seatId: params.seatId,
        startTime: params.startTime,
        durationHours: params.durationHours,
      });
      showToast(`Workstation ${res.seatCode} reserved for ${res.durationHours}h! Head to SE Lab 101 and scan the desk sticker in QR Check-In to activate.`, 'success');
      await loadData();
      setCurrentTab('checkin');
    } catch (err: any) {
      showToast(err.message || 'Reservation failed', 'error');
      throw err;
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Checkout from active session
  const handleCheckOut = async (sessionId: number) => {
    if (!currentUser) return;
    setActionLoading(true);
    try {
      await ApiClient.checkOut(sessionId, currentUser.id);
      setActiveSession(null);
      await loadData();
      showToast('Successfully checked out. Thank you for freeing your workstation!', 'success');
      setCurrentTab('map');
    } catch (err: any) {
      showToast(err.message || 'Checkout failed', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Admin Toggle Maintenance
  const handleToggleMaintenance = async (seat: Seat) => {
    try {
      const newStatus = seat.status === 'MAINTENANCE' ? 'AVAILABLE' : 'MAINTENANCE';
      await ApiClient.toggleSeatStatus(seat.id, newStatus);
      await loadData();
      if (selectedSeat && selectedSeat.id === seat.id) {
        setSelectedSeat({ ...selectedSeat, status: newStatus as any });
      }
      showToast(`Workstation ${seat.seatCode} marked as ${newStatus}`, 'info');
    } catch (err: any) {
      showToast(err.message || 'Action failed', 'error');
    }
  };

  // Admin Force Terminate
  const handleTerminateSession = async (sessionId: number, reason: string) => {
    try {
      await ApiClient.terminateSession(sessionId, reason);
      await loadData();
      showToast(`Session ${sessionId} terminated by administrator`, 'info');
    } catch (err: any) {
      showToast(err.message || 'Termination failed', 'error');
    }
  };

  const pendingReservationCount = userReservations.filter(r => r.status === 'PENDING_ACTIVATION').length;
  const expiringSoonCount = roomData ? roomData.seats.filter(s => s.status === 'EXPIRING_SOON').length : 0;

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-900 flex flex-col font-sans">
      {/* Navigation Bar */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        currentUser={currentUser}
        onOpenLogin={() => {
          setAuthModalPortal('student');
          setIsAuthModalOpen(true);
        }}
        onLogout={handleLogout}
        activeSessionCount={activeSession ? 1 : 0}
        activeReservationCount={pendingReservationCount}
      />

      {/* Toast Notification Container */}
      {toastMessage && (
        <div className="fixed bottom-20 sm:bottom-6 right-3 sm:right-6 left-3 sm:left-auto z-50 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className={`px-4 py-3 rounded-xl shadow-xl text-xs font-medium border flex items-center gap-2 max-w-sm ${
            toastMessage.type === 'success' ? 'bg-emerald-950 text-emerald-100 border-emerald-800' :
            toastMessage.type === 'error' ? 'bg-rose-950 text-rose-100 border-rose-800' :
            'bg-slate-900 text-white border-slate-700'
          }`}>
            <span>{toastMessage.text}</span>
            <button onClick={() => setToastMessage(null)} className="ml-auto text-white/70 hover:text-white p-1 cursor-pointer">✕</button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-3.5 sm:py-6 pb-24 md:pb-8">
        
        {/* ============================================================================== */}
        {/* TAB 1: HOME / 2D FLOOR PLAN */}
        {/* ============================================================================== */}
        {currentTab === 'map' && (
          <div className="space-y-4 sm:space-y-6">
            {!backendOnline && (
              <div className="text-xs font-medium text-amber-800 bg-amber-50 border border-amber-200/80 px-3.5 py-2 rounded-xl flex items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping shrink-0" />
                  <span>ORS Backend (<code className="font-mono font-bold text-[11px]">localhost:8080</code>) is starting or offline. Showing local SE Lab 101 layout.</span>
                </div>
                <button
                  onClick={() => loadData()}
                  className="text-xs font-bold text-amber-900 underline hover:no-underline cursor-pointer shrink-0"
                >
                  Retry Connection
                </button>
              </div>
            )}
            

            {/* SIMPLIFIED STUDENT LAB AVAILABILITY BANNER */}
            {roomData ? (
              <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start sm:items-center gap-3.5">
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 flex items-center justify-center shrink-0">
                    <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-md">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Open for Students
                      </span>
                      <span className="text-xs text-slate-500 font-medium">SE Innovation Lab 101</span>
                    </div>
                    <div className="mt-1 flex items-baseline gap-2">
                      <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                        <span className="text-emerald-600 font-mono">{roomData.availableSeats}</span>
                        <span className="text-slate-400 font-normal mx-1.5">/</span>
                        <span className="text-slate-700 font-mono">{roomData.totalSeats}</span>
                        <span className="ml-2 text-base sm:text-lg font-bold text-slate-700">Desks Available</span>
                      </h2>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Tap any green workstation on the floor plan to reserve, or scan a desk QR sticker to check in.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-stretch sm:self-auto flex-wrap sm:flex-nowrap">
                  <button
                    onClick={() => setCurrentTab('checkin')}
                    className="flex-1 sm:flex-none px-3.5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <span>📷</span>
                    <span>Scan Desk QR</span>
                  </button>

                  {activeSession && (
                    <button
                      onClick={() => setCurrentTab('session')}
                      className="flex-1 sm:flex-none px-3 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <span>⏱️</span>
                      <span>My Desk ({activeSession.seatCode})</span>
                    </button>
                  )}

                  {pendingReservationCount > 0 && !activeSession && (
                    <button
                      onClick={() => setCurrentTab('checkin')}
                      className="flex-1 sm:flex-none px-3 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <span>🔖</span>
                      <span>My Reservation ({userReservations[0]?.seatCode})</span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-4 bg-white rounded-xl border border-slate-200 text-xs font-mono text-slate-400 flex items-center gap-2">
                <div className="w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                Loading lab desk availability...
              </div>
            )}

            {/* Interactive 2D Map */}
            {roomData ? (
              <RoomMap2D
                room={roomData.room}
                seats={roomData.seats}
                selectedSeat={selectedSeat}
                onSelectSeat={(seat) => {
                  setSelectedSeat(seat);
                }}
                onScanQR={(seat) => {
                  setSelectedSeat(seat);
                }}
              />
            ) : (
              <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <span className="text-xs text-slate-500 font-mono">Loading laboratory coordinates from database...</span>
              </div>
            )}
          </div>
        )}

        {/* ============================================================================== */}
        {/* TAB 2: QR CHECK-IN & RESERVATIONS */}
        {/* ============================================================================== */}
        {currentTab === 'checkin' && (
          <QrCheckInModal
            seats={roomData?.seats || []}
            currentUser={currentUser}
            onOpenLogin={() => {
              setAuthModalPortal('student');
              setIsAuthModalOpen(true);
            }}
            onSessionActivated={async () => {
              await loadData();
              setCurrentTab('session');
              showToast('Workstation session activated! Live countdown started in My Session.', 'success');
            }}
            onNavigateToMap={() => setCurrentTab('map')}
          />
        )}

        {/* ============================================================================== */}
        {/* TAB 3: MY SESSION (SHOWS USER AVAILABLE TIME) */}
        {/* ============================================================================== */}
        {currentTab === 'session' && (
          <div className="space-y-6">
            <ActiveSessionCard
              session={activeSession}
              onCheckOut={handleCheckOut}
              isLoading={actionLoading}
            />

            {/* Student Session History */}
            {sessionHistory.length > 0 && (
              <div className="max-w-xl mx-auto bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                <h3 className="text-sm font-bold text-slate-900 mb-3">Your Previous Lab Sessions</h3>
                <div className="space-y-2.5">
                  {sessionHistory.map(hist => (
                    <div key={hist.id} className="p-3 rounded-lg border border-slate-100 bg-slate-50/70 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-slate-800">{hist.seatCode}</span>
                        <span className="text-slate-500 ml-2">({hist.roomName})</span>
                        <span className="text-[11px] text-slate-400 block font-mono">
                          {new Date(hist.checkedInAt).toLocaleDateString()} at {new Date(hist.checkedInAt).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-medium text-slate-700">{hist.durationMinutes} mins</span>
                        <span className={`block text-[10px] font-semibold ${
                          hist.status === 'CHECKED_OUT' ? 'text-emerald-600' : 'text-slate-500'
                        }`}>
                          {hist.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================================== */}
        {/* TAB 4: ADMIN CONSOLE (STRICTLY RESTRICTED TO ADMINISTRATORS) */}
        {/* ============================================================================== */}
        {currentTab === 'admin' && (
          currentUser?.role === 'ADMINISTRATOR' ? (
            <AdminDashboard
              roomData={roomData}
              onRefresh={loadData}
              onToggleSeatMaintenance={handleToggleMaintenance}
              onTerminateSession={handleTerminateSession}
            />
          ) : (
            <div className="max-w-md mx-auto my-8 sm:my-14 p-6 sm:p-8 bg-white rounded-3xl border border-slate-200 shadow-xl text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 flex items-center justify-center text-3xl shadow-xs">
                🛡️
              </div>
              <span className="inline-block text-[11px] font-bold text-amber-700 uppercase tracking-wider bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                Staff Restricted Area
              </span>
              <h2 className="text-xl font-extrabold text-slate-900 mt-3 mb-2 tracking-tight">
                Admin Console Portal
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed mb-6">
                The Laboratory Administration Console is strictly restricted to University Lab Technicians and Faculty Administrators. Regular students and guests cannot view or manage laboratory configurations, analytics, or session overrides.
              </p>

              {currentUser ? (
                <div className="p-3.5 mb-6 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-left">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Current Account</span>
                  <div className="flex items-center justify-between mt-1">
                    <span className="font-bold text-slate-800">{currentUser.fullName}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-100 text-blue-800 font-bold">
                      {currentUser.role}
                    </span>
                  </div>
                  <p className="text-[11px] text-rose-600 mt-2 font-medium">
                    ⚠️ Your student account does not have administrator privileges.
                  </p>
                </div>
              ) : (
                <div className="p-3.5 mb-6 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 text-left">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Status</span>
                  <p className="mt-1">
                    You are browsing in <strong>Guest (View-Only)</strong> mode. Please sign in with an Administrator profile to access this console.
                  </p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-2.5 justify-center">
                <button
                  onClick={() => {
                    setAuthModalPortal('admin');
                    setIsAuthModalOpen(true);
                  }}
                  className="px-4 py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
                >
                  <span>🔑</span>
                  <span>Sign In to Admin Portal</span>
                </button>
                <button
                  onClick={() => setCurrentTab('map')}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  Return to Floor Plan
                </button>
              </div>
            </div>
          )
        )}
      </main>

      {/* Seat Reservation Modal */}
      {selectedSeat && (
        <SeatDetailModal
          seat={selectedSeat}
          onClose={() => setSelectedSeat(null)}
          currentUser={currentUser}
          onOpenLogin={() => {
            setAuthModalPortal('student');
            setIsAuthModalOpen(true);
          }}
          onConfirmReservation={handleConfirmReservation}
          onToggleMaintenance={handleToggleMaintenance}
          onNavigateToCheckIn={() => setCurrentTab('checkin')}
        />
      )}

      {/* Authentication Modal with Student & Admin Portals */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLogin={handleLogin}
        currentUser={currentUser}
        defaultTab={authModalPortal}
        onContinueAsGuest={() => {
          setCurrentUser(null);
          showToast('Browsing as Guest in view-only mode.', 'info');
        }}
      />

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-6 mb-16 md:mb-0 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <span className="font-semibold text-slate-700">Occupancy Room System</span> · University Software Engineering Project
          </div>
          <div className="flex items-center gap-4 text-slate-500 font-mono text-[11px] flex-wrap justify-center">
            <button
              onClick={() => {
                if (currentUser?.role === 'ADMINISTRATOR') {
                  setCurrentTab('admin');
                } else {
                  setAuthModalPortal('admin');
                  setIsAuthModalOpen(true);
                }
              }}
              className="text-slate-500 hover:text-slate-800 hover:underline cursor-pointer transition-colors"
            >
              Staff & Admin Portal
            </button>
            <span aria-hidden="true">·</span>
            <span>MySQL 8.x (Port 3307)</span>
            <span aria-hidden="true">·</span>
            <span>Spring Boot 3.3.4</span>
            <span aria-hidden="true">·</span>
            <span>React 19</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
