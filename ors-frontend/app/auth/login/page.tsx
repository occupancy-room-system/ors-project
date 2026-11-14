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
      <div className="hidden lg:flex flex-col flex-1 relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 dark:from-slate-950 dark:via-blue-950/20 dark:to-slate-900 border-r border-border p-8 xl:p-14 justify-center">
        {/* Subtle decorative glow accents */}
        <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-xl mx-auto w-full space-y-7">
          {/* Top Brand Pill */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shrink-0 shadow-md shadow-primary/25">
              <Building2 className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-foreground">SE Lab Occupancy</span>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                  Lab 101
                </span>
              </div>
              <p className="text-xs text-muted-foreground">School of Information Technology</p>
            </div>
          </div>

          {/* Hero Headlines */}
          <div className="space-y-3">
            <h1 className="text-3xl sm:text-4xl xl:text-5xl font-black tracking-tight text-foreground leading-[1.15]">
              Software Engineering <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 dark:from-blue-400 dark:via-indigo-300 dark:to-sky-400">
                Workstation &amp; Lab System
              </span>
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-lg">
              Sign in with your Student ID to view real-time desk occupancy on the interactive 2D floor plan, book group or solo workstations, and check in instantly via QR scan.
            </p>
          </div>

          {/* Feature Cards Grid (2x2) with rich icons and descriptions */}
          <div className="grid grid-cols-2 gap-3.5 pt-1">
            {[
              {
                icon: LayoutGrid,
                title: '2D Floor Plan',
                desc: 'Real-time seat status & navigation',
              },
              {
                icon: Users,
                title: 'Group Tables 1–5',
                desc: 'Collaborative team workspaces',
              },
              {
                icon: MonitorSmartphone,
                title: 'Solo Pods A–E',
                desc: 'Distraction-free personal study desks',
              },
              {
                icon: QrCode,
                title: 'QR Check-In',
                desc: 'Scan desk code for instant activation',
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="group p-3.5 rounded-2xl border border-border/60 bg-background/80 dark:bg-slate-900/70 shadow-xs hover:border-primary/40 hover:shadow-md transition-all backdrop-blur-sm"
              >
                <div className="flex items-center gap-2.5 mb-1.5">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 group-hover:bg-primary group-hover:text-primary-foreground text-primary flex items-center justify-center shrink-0 transition-colors">
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-foreground">{title}</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-normal pl-0.5">
                  {desc}
                </p>
              </div>
            ))}
          </div>

          {/* Bottom Stats Row - right below features, nicely integrated */}
          <div className="pt-6 border-t border-border/60">
            <div className="grid grid-cols-4 gap-4">
              {[
                { val: '54', label: 'Total Desks' },
                { val: '5', label: 'Group Tables' },
                { val: '5', label: 'Solo Pods' },
                { val: '20m', label: 'Grace Window', color: 'text-emerald-600 dark:text-emerald-400' },
              ].map(({ val, label, color }) => (
                <div key={label} className="space-y-0.5">
                  <p className={`text-2xl xl:text-3xl font-black tracking-tight ${color ?? 'text-foreground'}`}>
                    {val}
                  </p>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Right Panel ── */}
      <div className="flex flex-col items-center justify-center w-full lg:w-[480px] xl:w-[540px] shrink-0 p-6 sm:p-10 relative min-h-screen lg:min-h-0 bg-background/50">
        {/* Theme toggle */}
        <div className="absolute top-5 right-5">
          <ThemeToggle />
        </div>

        {/* Mobile brand (shows only on small screens) */}
        <div className="flex lg:hidden items-center gap-2.5 mb-6 self-start sm:self-center">
          <div className="w-9 h-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shrink-0 shadow-sm">
            <Building2 className="w-4 h-4" aria-hidden="true" />
          </div>
          <div>
            <span className="text-sm font-bold text-foreground">SE Lab Occupancy</span>
            <span className="text-[10px] text-muted-foreground block">SE Innovation Lab 101</span>
          </div>
        </div>

        <div className="w-full max-w-[390px] rounded-2xl border border-border/70 bg-card/90 shadow-xl backdrop-blur-md p-6 sm:p-7 space-y-5">
          {/* Error */}
          {errorMsg && (
            <div className="p-3 text-xs rounded-xl border border-destructive/20 bg-destructive/10 text-destructive font-medium">
              {errorMsg}
            </div>
          )}

          {/* ── Sign In Form ── */}
          {activeTab === 'signin' && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-xl font-black tracking-tight text-foreground">Sign In to Your Account</h3>
                <p className="text-xs text-muted-foreground">
                  Enter your Student ID and password to access reservations.
                </p>
              </div>

              <form onSubmit={handleSignIn} className="space-y-3.5 pt-1">
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
                      className="pl-9 text-xs h-10 rounded-xl"
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
                      className="pl-9 pr-9 text-xs h-10 rounded-xl"
                      disabled={isPending}
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-1 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <Button type="submit" className="w-full h-10 rounded-xl font-bold gap-2 cursor-pointer shadow-md shadow-primary/20 transition-all mt-2" disabled={isPending}>
                  {loginMutation.isPending ? (
                    <><Loader2 className="w-4 h-4 animate-spin" />Signing in…</>
                  ) : (
                    <>Sign In →</>
                  )}
                </Button>
              </form>

              <p className="text-center text-xs text-muted-foreground pt-1">
                Don&apos;t have an account yet?{' '}
                <button type="button" onClick={() => switchTab('signup')} className="font-bold text-primary hover:underline cursor-pointer">
                  Sign Up here
                </button>
              </p>
            </div>
          )}

          {/* ── Sign Up Form ── */}
          {activeTab === 'signup' && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-xl font-black tracking-tight text-foreground">Create Your Account</h3>
                <p className="text-xs text-muted-foreground">
                  Register with your Student ID to access the lab system.
                </p>
              </div>

              <form onSubmit={handleSignUp} className="space-y-3.5 pt-1">
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
                      className="pl-9 text-xs h-10 rounded-xl"
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
                      className="pl-9 text-xs h-10 rounded-xl"
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
                      className="pl-9 pr-9 text-xs h-10 rounded-xl"
                      disabled={isPending}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      className="absolute right-1 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <Button type="submit" className="w-full h-10 rounded-xl font-bold gap-2 cursor-pointer shadow-md shadow-primary/20 transition-all mt-2" disabled={isPending}>
                  {registerMutation.isPending ? (
                    <><Loader2 className="w-4 h-4 animate-spin" />Creating account…</>
                  ) : (
                    <>Create Account <ArrowRight className="w-4 h-4" /></>
                  )}
                </Button>
              </form>

              <p className="text-center text-xs text-muted-foreground pt-1">
                Already have an account?{' '}
                <button type="button" onClick={() => switchTab('signin')} className="font-bold text-primary hover:underline cursor-pointer">
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
