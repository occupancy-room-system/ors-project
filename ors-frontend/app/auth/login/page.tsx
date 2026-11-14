'use client';

import React, { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLoginMutation, useRegisterMutation } from '@/hooks/use-auth-query';
import { useApp } from '@/hooks/use-app-store';
import { ROUTES } from '@/config/routes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Lock, Eye, EyeOff, Loader2, ArrowRight,
  Building2, GraduationCap,
  User, LayoutGrid, QrCode, Users, MonitorSmartphone,
  CheckCircle2,
} from 'lucide-react';
import { ThemeToggle } from '@/components/theme/theme-toggle';

type AuthTab = 'signin' | 'signup';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setCurrentUser, showToast } = useApp();
  const loginMutation = useLoginMutation();
  const registerMutation = useRegisterMutation();

  const getRedirectPath = (role: string) => {
    const isAdmin = role === 'ADMINISTRATOR' || role === 'ROLE_ADMIN';
    const redirect = searchParams.get('redirect');

    // Never redirect a student to an admin route or empty/auth route
    if (!isAdmin && (!redirect || redirect.startsWith('/admin') || redirect.startsWith('/auth') || redirect === '')) {
      return ROUTES.HOME;
    }

    // Default admin to admin dashboard
    if (isAdmin) {
      if (redirect && !redirect.startsWith('/auth') && redirect !== '/') {
        return redirect;
      }
      return ROUTES.ADMIN;
    }

    if (redirect && !redirect.startsWith('/auth')) {
      return redirect;
    }

    return ROUTES.HOME;
  };

  const initialTab: AuthTab = searchParams.get('tab') === 'signup' ? 'signup' : 'signin';
  const [activeTab, setActiveTab] = useState<AuthTab>(initialTab);

  // Sign In state
  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Sign Up state
  const [regStudentId, setRegStudentId] = useState('');
  const [regFullName, setRegFullName] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isPending = loginMutation.isPending || registerMutation.isPending;

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId.trim()) { setErrorMsg('Please enter your Student ID.'); return; }
    if (!password) { setErrorMsg('Please enter your password.'); return; }
    setErrorMsg(null);
    try {
      const { user } = await loginMutation.mutateAsync({ studentId: studentId.trim(), password });
      const isAdmin = user.role === 'ADMINISTRATOR' || user.role === 'ROLE_ADMIN';
      setCurrentUser(user);
      showToast(`Welcome back, ${user.fullName || user.username}!`, 'success');
      if (isAdmin) {
        window.location.href = ROUTES.ADMIN;
      } else {
        window.location.href = getRedirectPath(user.role);
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Invalid Student ID or password. Please try again.');
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regStudentId.trim()) { setErrorMsg('Student ID is required.'); return; }
    if (regStudentId.trim().length < 3) { setErrorMsg('Student ID must be at least 3 characters.'); return; }
    if (!regFullName.trim()) { setErrorMsg('Full name is required.'); return; }
    if (regPassword.length < 6) { setErrorMsg('Password must be at least 6 characters.'); return; }
    setErrorMsg(null);
    try {
      await registerMutation.mutateAsync({ studentId: regStudentId.trim(), fullName: regFullName.trim(), password: regPassword });
      try {
        const { user } = await loginMutation.mutateAsync({ studentId: regStudentId.trim(), password: regPassword });
        const isAdmin = user.role === 'ADMINISTRATOR' || user.role === 'ROLE_ADMIN';
        setCurrentUser(user);
        showToast(`Account created! Welcome, ${user.fullName || user.username}!`, 'success');
        if (isAdmin) {
          window.location.href = ROUTES.ADMIN;
        } else {
          window.location.href = ROUTES.HOME;
        }
      } catch {
        showToast('Account registered! Please sign in.', 'success');
        setStudentId(regStudentId.trim());
        setActiveTab('signin');
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Registration failed. Please try again.');
    }
  };

  const switchTab = (tab: AuthTab) => { setActiveTab(tab); setErrorMsg(null); };

  const features = [
    { icon: LayoutGrid, label: '2D Floor Plan' },
    { icon: Users, label: 'Group Tables 1–5' },
    { icon: MonitorSmartphone, label: 'Individual Pods A–E' },
    { icon: QrCode, label: 'QR Check-In' },
  ];

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-background">
      {/* ── Left Panel ── */}
      <div className="hidden lg:flex flex-col flex-1 bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-blue-950/30 border-r border-border p-10 xl:p-16 justify-between">
        {/* Top brand */}
        <div>
          <div className="flex items-center gap-2.5 mb-10">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground leading-tight">SE Lab Occupancy</p>
              <p className="text-[11px] text-muted-foreground leading-tight">SE Innovation Lab 101</p>
            </div>

          </div>


          <h1 className="text-4xl xl:text-5xl font-black tracking-tight text-foreground leading-tight mb-2">
            Software Engineering
          </h1>
          <h2 className="text-4xl xl:text-5xl font-black tracking-tight text-primary leading-tight mb-5">
            Workstation &amp; Lab System
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-md mb-10">
            Sign in with your Student ID to view live desk occupancy on the 2D floor plan,
            reserve workstations, and scan physical desk QR stickers upon arrival.
          </p>

          {/* Feature cards grid */}
          <div className="grid grid-cols-2 gap-3 max-w-lg">
            {features.map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="bg-background/70 dark:bg-slate-900/60 border border-border/60 rounded-xl p-4 flex items-center gap-1.5 text-primary text-xs font-bold backdrop-blur-sm"
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom stats */}
        <div className="flex gap-8 pt-8 border-t border-border/50 mt-10">
          {[
            { val: '54', label: 'Total Desks' },
            { val: '5', label: 'Group Tables' },
            { val: '5', label: 'Solo Pods' },
            { val: '20m', label: 'Grace Window', color: 'text-emerald-600 dark:text-emerald-400' },
          ].map(({ val, label, color }) => (
            <div key={label}>
              <p className={`text-2xl font-black ${color ?? 'text-primary'}`}>{val}</p>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right Panel ── */}
      <div className="flex flex-col items-center justify-center w-full lg:w-[460px] xl:w-[520px] shrink-0 p-4 pt-20 sm:p-10 relative min-h-screen lg:min-h-0">
        {/* Theme toggle */}
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>

        {/* Mobile brand (shows only on small screens) */}
        <div className="flex lg:hidden items-center gap-2 mb-6 self-start sm:self-center">
          <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Building2 className="w-4 h-4" aria-hidden="true" />
          </div>
          <span className="text-sm font-bold">SE Lab Occupancy</span>
        </div>

        <div className="w-full max-w-sm">
          {/* Tab switcher */}
          <div className="flex rounded-xl border border-border bg-muted/40 p-1 mb-6">
            <button
              onClick={() => switchTab('signin')}
              className={`flex-1 flex items-center justify-center gap-1.5 h-11 sm:h-9 rounded-lg text-xs font-bold transition-all cursor-pointer ${activeTab === 'signin'
                ? 'bg-background shadow-sm text-foreground'
                : 'text-muted-foreground hover:text-foreground'
                }`}
            >
              Sign In
            </button>
            <button
              onClick={() => switchTab('signup')}
              className={`flex-1 flex items-center justify-center gap-1.5 h-11 sm:h-9 rounded-lg text-xs font-bold transition-all cursor-pointer ${activeTab === 'signup'
                ? 'bg-background shadow-sm text-foreground'
                : 'text-muted-foreground hover:text-foreground'
                }`}
            >
              Sign Up
            </button>
          </div>

          {/* Error */}
          {errorMsg && (
            <div className="mb-4 p-3 text-xs rounded-xl border border-destructive/20 bg-destructive/10 text-destructive font-medium">
              {errorMsg}
            </div>
          )}

          {/* ── Sign In Form ── */}
          {activeTab === 'signin' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-xl font-black text-foreground">Sign In to Your Account</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Enter your Student ID and password to access reservations.
                </p>
              </div>

              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="si-studentId" className="text-xs font-semibold">Student ID</Label>
                  <div className="relative">
                    <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    <Input
                      id="si-studentId"
                      type="text"
                      placeholder="e.g. 6531501001"
                      value={studentId}
                      onChange={(e) => setStudentId(e.target.value)}
                      className="pl-9 text-xs h-11"
                      disabled={isPending}
                      autoComplete="username"
                      autoFocus
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="si-password" className="text-xs font-semibold">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    <Input
                      id="si-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-9 pr-9 text-xs h-11"
                      disabled={isPending}
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-1 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <Button type="submit" className="w-full h-11 font-bold gap-2 cursor-pointer" disabled={isPending}>
                  {loginMutation.isPending ? (
                    <><Loader2 className="w-4 h-4 animate-spin" />Signing in…</>
                  ) : (
                    <>Sign In →</>
                  )}
                </Button>
              </form>

              <p className="text-center text-xs text-muted-foreground">
                Don&apos;t have an account yet?{' '}
                <button onClick={() => switchTab('signup')} className="font-bold text-primary hover:underline cursor-pointer">
                  Sign Up here
                </button>
              </p>
            </div>
          )}

          {/* ── Sign Up Form ── */}
          {activeTab === 'signup' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-xl font-black text-foreground">Create Your Account</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Register with your Student ID to get access to the lab reservation system.
                </p>
              </div>

              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="su-studentId" className="text-xs font-semibold">Student ID</Label>
                  <div className="relative">
                    <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    <Input
                      id="su-studentId"
                      type="text"
                      placeholder="e.g. 6531501001"
                      value={regStudentId}
                      onChange={(e) => setRegStudentId(e.target.value)}
                      className="pl-9 text-xs h-11"
                      disabled={isPending}
                      autoComplete="username"
                      autoFocus
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="su-fullname" className="text-xs font-semibold">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    <Input
                      id="su-fullname"
                      type="text"
                      placeholder="e.g. Alex Chen"
                      value={regFullName}
                      onChange={(e) => setRegFullName(e.target.value)}
                      className="pl-9 text-xs h-11"
                      disabled={isPending}
                      autoComplete="name"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="su-password" className="text-xs font-semibold">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    <Input
                      id="su-password"
                      type={showRegPassword ? 'text' : 'password'}
                      placeholder="Min. 6 characters"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      className="pl-9 pr-9 text-xs h-11"
                      disabled={isPending}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      className="absolute right-1 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Benefits list */}
                <ul className="space-y-1.5 py-1">
                  {[
                    'Reserve desks in advance',
                    'QR scan check-in at your desk',
                    'Track active lab sessions',
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>

                <Button type="submit" className="w-full h-11 font-bold gap-2 cursor-pointer" disabled={isPending}>
                  {registerMutation.isPending ? (
                    <><Loader2 className="w-4 h-4 animate-spin" />Creating account…</>
                  ) : (
                    <>Create Account <ArrowRight className="w-4 h-4" /></>
                  )}
                </Button>
              </form>

              <p className="text-center text-xs text-muted-foreground">
                Already have an account?{' '}
                <button onClick={() => switchTab('signin')} className="font-bold text-primary hover:underline cursor-pointer">
                  Sign in here
                </button>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>}>
      <LoginForm />
    </Suspense>
  );
}
