import React from 'react';
import { User } from '../../types';

interface NavbarProps {
  currentTab: 'map' | 'checkin' | 'session' | 'history' | 'admin';
  onSelectTab: (tab: 'map' | 'checkin' | 'session' | 'history' | 'admin') => void;
  currentUser: User | null;
  onOpenLogin: () => void;
  onLogout: () => void;
  activeSessionCount: number;
  activeReservationCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  currentUser,
  onOpenLogin,
  onLogout,
  activeSessionCount,
  activeReservationCount = 0,
}) => {
  return (
    <>
      {/* Top Navigation Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-4">
          
          {/* Brand Wordmark */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-extrabold text-xs sm:text-sm shadow-xs">
              SE
            </div>
            <button
              onClick={() => onSelectTab('map')}
              className="text-left group cursor-pointer focus:outline-none"
            >
              <span className="text-sm sm:text-base font-extrabold tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors">
                <span className="hidden xs:inline">SE </span>Lab Occupancy
              </span>
            </button>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <button
              onClick={() => onSelectTab('map')}
              className={`whitespace-nowrap shrink-0 transition-colors py-1 cursor-pointer ${
                currentTab === 'map' ? 'text-blue-600 font-bold border-b-2 border-blue-600' : 'hover:text-slate-900'
              }`}
            >
              2D Floor Plan
            </button>

            <button
              onClick={() => onSelectTab('checkin')}
              className={`relative whitespace-nowrap shrink-0 transition-colors py-1 cursor-pointer flex items-center gap-1.5 ${
                currentTab === 'checkin' ? 'text-blue-600 font-bold border-b-2 border-blue-600' : 'hover:text-slate-900'
              }`}
            >
              <span>QR Check-In</span>
              {activeReservationCount > 0 && (
                <span className="px-1.5 py-0.2 text-[10px] font-bold bg-indigo-100 text-indigo-800 rounded">
                  {activeReservationCount} Reserved
                </span>
              )}
            </button>

            <button
              onClick={() => onSelectTab('session')}
              className={`relative whitespace-nowrap shrink-0 transition-colors py-1 cursor-pointer flex items-center gap-1.5 ${
                currentTab === 'session' ? 'text-blue-600 font-bold border-b-2 border-blue-600' : 'hover:text-slate-900'
              }`}
            >
              <span>My Session</span>
              {activeSessionCount > 0 && (
                <span className="px-1.5 py-0.2 text-[10px] font-semibold bg-emerald-100 text-emerald-800 rounded">
                  Active
                </span>
              )}
            </button>

            {currentUser?.role === 'ADMINISTRATOR' && (
              <button
                onClick={() => onSelectTab('admin')}
                className={`whitespace-nowrap shrink-0 transition-colors py-1 cursor-pointer flex items-center gap-1.5 ${
                  currentTab === 'admin' ? 'text-blue-600 font-bold border-b-2 border-blue-600' : 'hover:text-slate-900'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>Admin Console</span>
              </button>
            )}
          </nav>

          {/* Right Action / User Profile */}
          <div className="flex items-center gap-2 shrink-0">
            {currentUser ? (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  onClick={onOpenLogin}
                  title="View account details or switch profile"
                  className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl border border-slate-200 transition-colors cursor-pointer"
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      currentUser.role === 'ADMINISTRATOR' ? 'bg-amber-500' : 'bg-blue-500'
                    }`}
                  />
                  <span className="font-bold truncate max-w-[90px] sm:max-w-none">
                    {currentUser.fullName}
                  </span>
                  <span className="hidden sm:inline text-slate-400 font-normal">
                    ({currentUser.role === 'ADMINISTRATOR' ? 'Admin' : 'Student'})
                  </span>
                </button>
                <button
                  onClick={onLogout}
                  title="Sign out"
                  className="p-1.5 text-xs text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                >
                  <span className="hidden sm:inline">Logout</span>
                  <span className="sm:hidden text-sm">🚪</span>
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenLogin}
                className="px-3.5 py-1.5 sm:px-4 sm:py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      {/* App-like Fixed Mobile Bottom Navigation Bar (Phone & Tablet) */}
      <nav
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200 px-2 py-1 shadow-lg flex items-center justify-around safe-bottom"
      >
        <button
          onClick={() => onSelectTab('map')}
          className={`flex-1 py-1.5 px-1 flex flex-col items-center justify-center text-[10px] font-bold transition-all cursor-pointer select-none ${
            currentTab === 'map' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <span className="text-lg">🗺️</span>
          <span className="mt-0.5">Floor Plan</span>
          {currentTab === 'map' && <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-0.5" />}
        </button>

        <button
          onClick={() => onSelectTab('checkin')}
          className={`relative flex-1 py-1.5 px-1 flex flex-col items-center justify-center text-[10px] font-bold transition-all cursor-pointer select-none ${
            currentTab === 'checkin' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <div className="relative">
            <span className="text-lg">📱</span>
            {activeReservationCount > 0 && (
              <span className="absolute -top-1 -right-2 px-1 text-[9px] font-extrabold bg-indigo-600 text-white rounded-full min-w-4 text-center">
                {activeReservationCount}
              </span>
            )}
          </div>
          <span className="mt-0.5">QR Check-In</span>
          {currentTab === 'checkin' && <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-0.5" />}
        </button>

        <button
          onClick={() => onSelectTab('session')}
          className={`relative flex-1 py-1.5 px-1 flex flex-col items-center justify-center text-[10px] font-bold transition-all cursor-pointer select-none ${
            currentTab === 'session' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <div className="relative">
            <span className="text-lg">⏱️</span>
            {activeSessionCount > 0 && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse border-2 border-white" />
            )}
          </div>
          <span className="mt-0.5">My Session</span>
          {currentTab === 'session' && <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-0.5" />}
        </button>

        {currentUser?.role === 'ADMINISTRATOR' && (
          <button
            onClick={() => onSelectTab('admin')}
            className={`flex-1 py-1.5 px-1 flex flex-col items-center justify-center text-[10px] font-bold transition-all cursor-pointer select-none ${
              currentTab === 'admin' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <span className="text-lg">⚙️</span>
            <span className="mt-0.5">Admin</span>
            {currentTab === 'admin' && <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-0.5" />}
          </button>
        )}
      </nav>
    </>
  );
};
