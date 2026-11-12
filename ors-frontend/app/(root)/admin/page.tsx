'use client';

import React, { useState } from 'react';
import { useLoginMutation } from '@/hooks/use-auth-query';
import { useApp } from '@/hooks/use-app-store';
import { useActions } from '@/hooks/use-actions';
import { AdminDashboard } from './components/admin-dashboard';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building2, Eye, EyeOff, Loader2, LockKeyhole, UserRound } from 'lucide-react';
import { ThemeToggle } from '@/components/theme/theme-toggle';

export default function AdminPage() {
  const { currentUser, roomData, loadData, setCurrentUser, showToast } = useApp();
  const { handleToggleMaintenance, handleTerminateSession } = useActions();
  const loginMutation = useLoginMutation();
  const [adminId, setAdminId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isAdmin = currentUser?.role === 'ADMINISTRATOR' || currentUser?.role === 'ROLE_ADMIN';

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminId.trim()) {
      setErrorMsg('Please enter your administrator ID.');
      return;
    }
    if (!password) {
      setErrorMsg('Please enter your password.');
      return;
    }

    setErrorMsg(null);
    try {
      const { user } = await loginMutation.mutateAsync({
        studentId: adminId.trim(),
        password,
      });

      if (user.role !== 'ADMINISTRATOR' && user.role !== 'ROLE_ADMIN') {
        setCurrentUser(null);
        setErrorMsg('This account does not have administrator access.');
        return;
      }

      setCurrentUser(user);
      showToast(`Welcome back, ${user.fullName || user.username}!`, 'success');
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Invalid administrator ID or password.');
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-blue-950/30 relative">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>
        <Card className="w-full max-w-sm rounded-2xl border-border/60 bg-background/90 shadow-xl backdrop-blur-sm">
          <CardContent className="p-6 sm:p-8">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Building2 className="h-5 w-5" aria-hidden="true" />
              </div>
              <h1 className="text-xl font-black tracking-tight text-foreground">Admin Sign In</h1>
            </div>

            {errorMsg && (
              <div role="alert" className="mb-4 rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-xs font-medium text-destructive">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="admin-id" className="text-xs font-semibold">Administrator ID</Label>
                <div className="relative">
                  <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                  <Input
                    id="admin-id"
                    type="text"
                    placeholder="Username or email"
                    value={adminId}
                    onChange={(e) => setAdminId(e.target.value)}
                    className="h-11 pl-9 text-sm"
                    disabled={loginMutation.isPending}
                    autoComplete="username"
                    autoFocus
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="admin-password" className="text-xs font-semibold">Password</Label>
                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                  <Input
                    id="admin-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-11 pl-9 pr-10 text-sm"
                    disabled={loginMutation.isPending}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center text-muted-foreground hover:text-foreground"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" className="h-11 w-full gap-2 font-bold" disabled={loginMutation.isPending}>
                {loginMutation.isPending ? (
                  <><Loader2 className="h-4 w-4 animate-spin" />Signing in…</>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <AdminDashboard
      roomData={roomData}
      onRefresh={loadData}
      onToggleSeatMaintenance={handleToggleMaintenance}
      onTerminateSession={handleTerminateSession}
    />
  );
}
