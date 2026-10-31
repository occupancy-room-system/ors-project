'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/hooks/use-app-store';
import { useRouter } from 'next/navigation';
import { User } from '@/types';

// ─── Preset accounts ──────────────────────────────────────────────────────────
const PRESET_STUDENTS: User[] = [
  { id: 2, fullName: 'Alex Chen', email: 'alex.chen@student.university.edu', role: 'STUDENT', accountStatus: 'ACTIVE' },
  { id: 3, fullName: 'Sarah Kim', email: 'sarah.kim@student.university.edu', role: 'STUDENT', accountStatus: 'ACTIVE' },
  { id: 4, fullName: 'Marcus Taylor', email: 'marcus.taylor@student.university.edu', role: 'STUDENT', accountStatus: 'ACTIVE' },
];

const ADMIN_USER: User = {
  id: 1, fullName: 'Prof. Robert Vance', email: 'admin@university.edu',
  role: 'ADMINISTRATOR', accountStatus: 'ACTIVE',
};

/**
 * AuthModal — reads open state and portal from AppContext.
 * No props needed; place once in layout.tsx.
 */
export function AuthModal() {
  const { isAuthModalOpen, authModalPortal, closeAuthModal, currentUser, setCurrentUser, showToast } = useApp();
  const router = useRouter();

  const [activePortal, setActivePortal] = useState<'student' | 'admin'>(authModalPortal);
  const [studentEmailInput, setStudentEmailInput] = useState('');
  const [adminKeyInput, setAdminKeyInput] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthModalOpen) {
      setActivePortal(authModalPortal);
      setErrorMsg(null);
    }
  }, [isAuthModalOpen, authModalPortal]);

  if (!isAuthModalOpen) return null;

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    showToast(`Signed in as ${user.fullName} (${user.role})`, 'success');
    closeAuthModal();
    if (user.role === 'ADMINISTRATOR') router.push('/admin');
  };

  const handleStudentLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const clean = studentEmailInput.trim().toLowerCase();
    if (!clean) { setErrorMsg('Please enter your university student email.'); return; }
    const found = PRESET_STUDENTS.find(u => u.email.toLowerCase() === clean);
    handleLogin(found ?? { id: Date.now(), fullName: clean.split('@')[0].replace('.', ' ').toUpperCase(), email: clean, role: 'STUDENT', accountStatus: 'ACTIVE' });
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (['admin@university.edu', 'admin123', ''].includes(adminKeyInput.trim())) {
      handleLogin(ADMIN_USER);
    } else {
      setErrorMsg('Invalid administrator credentials. Access to the Admin Console is restricted.');
    }
  };

  const handleGuest = () => {
    setCurrentUser(null);
    showToast('Browsing as Guest in view-only mode.', 'info');
    closeAuthModal();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">

        {/* Mobile drag handle */}
        <div className="w-12 h-1 bg-slate-300 rounded-full mx-auto mt-2.5 mb-1 sm:hidden shrink-0" />

        {/* Header + portal switcher */}
        <div className="border-b border-slate-100 bg-slate-50/70 p-3 sm:p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-blue-600 text-white font-extrabold text-[11px] flex items-center justify-center">SE</div>
              <span className="text-xs font-bold text-slate-900 tracking-tight">University SE Lab Access</span>
            </div>
            <button onClick={closeAuthModal} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors cursor-pointer text-base font-bold" aria-label="Close">✕</button>
          </div>
          <div className="grid grid-cols-2 p-1 bg-slate-200/80 rounded-xl text-xs font-semibold">
            {(['student', 'admin'] as const).map(tab => (
              <button
                key={tab}
                type="button"
                onClick={() => { setActivePortal(tab); setErrorMsg(null); }}
                className={`py-2 px-3 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  activePortal === tab
                    ? tab === 'student' ? 'bg-white text-blue-700 shadow-xs font-bold' : 'bg-white text-amber-800 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>{tab === 'student' ? '🎓' : '🛡️'}</span>
                <span>{tab === 'student' ? 'Student Login' : 'Admin Portal'}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Error */}
        {errorMsg && (
          <div className="mx-4 sm:mx-6 mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <span>⚠️</span><span>{errorMsg}</span>
          </div>
        )}

        {/* Student portal */}
        {activePortal === 'student' && (
          <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto">
            <div>
              <h3 className="text-base font-bold text-slate-900">Student Portal Sign In</h3>
              <p className="text-xs text-slate-600 mt-0.5">Sign in to reserve workstations and scan desk QR stickers.</p>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Quick Select (Demo)</label>
              <div className="space-y-2">
                {PRESET_STUDENTS.map(acc => (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => handleLogin(acc)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      currentUser?.id === acc.id ? 'border-blue-600 bg-blue-50/60 text-blue-900 shadow-xs' : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center">{acc.fullName.charAt(0)}</div>
                      <div>
                        <div className="font-semibold text-xs text-slate-900">{acc.fullName} <span className="text-[10px] px-1.5 rounded bg-blue-100 text-blue-800 font-mono">STUDENT</span></div>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5">{acc.email}</div>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-blue-600">Sign In →</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Or Enter University Email</label>
              <form onSubmit={handleStudentLogin} className="flex gap-2">
                <input type="email" placeholder="student.id@university.edu" value={studentEmailInput} onChange={e => setStudentEmailInput(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500" />
                <button type="submit" className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer whitespace-nowrap">Continue</button>
              </form>
            </div>

            <div className="pt-3 border-t border-slate-100">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5"><span>👀</span><span>Just looking around?</span></div>
                  <p className="text-[11px] text-slate-500 mt-0.5">Browse the 2D floor plan without signing in.</p>
                </div>
                <button type="button" onClick={handleGuest} className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors cursor-pointer shrink-0">Continue as Guest</button>
              </div>
            </div>
          </div>
        )}

        {/* Admin portal */}
        {activePortal === 'admin' && (
          <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto">
            <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200/80 text-amber-900">
              <div className="flex items-center gap-2 font-bold text-xs"><span>🛡️</span><span>Restricted Administration Console</span></div>
              <p className="text-[11px] text-amber-800 mt-1 leading-relaxed">This portal is strictly for Laboratory Supervisors and Faculty Administrators.</p>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Authorized Admin Profile</label>
              <button type="button" onClick={() => handleLogin(ADMIN_USER)}
                className="w-full flex items-center justify-between p-3.5 rounded-xl border-2 border-amber-300 bg-amber-50/40 hover:bg-amber-100/60 text-left transition-all cursor-pointer group shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-amber-500 text-white font-bold text-xs flex items-center justify-center shadow-xs">RV</div>
                  <div>
                    <div className="font-bold text-xs text-slate-900">{ADMIN_USER.fullName} <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 font-mono font-bold">ADMINISTRATOR</span></div>
                    <div className="text-[11px] text-slate-600 font-mono mt-0.5">{ADMIN_USER.email}</div>
                  </div>
                </div>
                <span className="text-xs font-bold text-amber-800 group-hover:underline">Sign In as Admin →</span>
              </button>
            </div>

            <form onSubmit={handleAdminLogin} className="space-y-3 pt-2 border-t border-slate-100">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Or Admin Passkey / Email</label>
              <div className="flex gap-2">
                <input type="password" placeholder="admin@university.edu or passkey" value={adminKeyInput} onChange={e => setAdminKeyInput(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono" />
                <button type="submit" className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer">Verify</button>
              </div>
              <p className="text-[11px] text-slate-400">Authorized staff can click the profile above or enter <code className="font-mono text-slate-600">admin@university.edu</code>.</p>
            </form>
          </div>
        )}

      </div>
    </div>
  );
}
