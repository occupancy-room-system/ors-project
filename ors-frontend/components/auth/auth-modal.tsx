'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/hooks/use-app-store';
import { useLoginMutation, useRegisterMutation } from '@/hooks/use-auth-query';
import { ROUTES } from '@/config/routes';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GraduationCap, Lock, User, Eye, EyeOff, Loader2, ArrowRight } from 'lucide-react';

export function AuthModal() {
  const { isAuthModalOpen, closeAuthModal, setCurrentUser, showToast } = useApp();
  const router = useRouter();
  const loginMutation = useLoginMutation();
  const registerMutation = useRegisterMutation();

  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  // Login form state
  const [loginStudentId, setLoginStudentId] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Register form state
  const [regStudentId, setRegStudentId] = useState('');
  const [regFullName, setRegFullName] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthModalOpen) {
      setErrorMsg(null);
      setLoginPassword('');
      setRegPassword('');
    }
  }, [isAuthModalOpen]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginStudentId.trim()) {
      setErrorMsg('Please enter your Student ID.');
      return;
    }
    if (!loginPassword) {
      setErrorMsg('Please enter your password.');
      return;
    }

    setErrorMsg(null);
    try {
      const { user } = await loginMutation.mutateAsync({
        studentId: loginStudentId.trim(),
        password: loginPassword,
      });

      setCurrentUser(user);
      showToast(`Welcome back, ${user.fullName || user.username}!`, 'success');
      closeAuthModal();

      if (user.role === 'ADMINISTRATOR' || user.role === 'ROLE_ADMIN') {
        router.push(ROUTES.ADMIN);
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Invalid Student ID or password.');
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regStudentId.trim()) {
      setErrorMsg('Student ID is required.');
      return;
    }
    if (regStudentId.trim().length < 3) {
      setErrorMsg('Student ID must be at least 3 characters.');
      return;
    }
    if (!regFullName.trim()) {
      setErrorMsg('Full name is required.');
      return;
    }
    if (regPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    setErrorMsg(null);
    try {
      await registerMutation.mutateAsync({
        studentId: regStudentId.trim(),
        fullName: regFullName.trim(),
        password: regPassword,
      });

      // Automatically sign in upon registration
      try {
        const { user } = await loginMutation.mutateAsync({
          studentId: regStudentId.trim(),
          password: regPassword,
        });
        setCurrentUser(user);
        showToast(`Account created! Welcome, ${user.fullName || user.username}!`, 'success');
        closeAuthModal();
      } catch {
        showToast('Account registered successfully! Please sign in.', 'success');
        setLoginStudentId(regStudentId.trim());
        setActiveTab('login');
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Registration failed. Please try again.');
    }
  };

  const isPending = loginMutation.isPending || registerMutation.isPending;

  return (
    <Dialog open={isAuthModalOpen} onOpenChange={(open) => !open && closeAuthModal()}>
      <DialogContent className="sm:max-w-[420px] p-0 overflow-hidden border-border bg-card">
        {/* Header */}
        <DialogHeader className="p-4 sm:p-6 sm:pb-4 pb-4 border-b border-border/60 bg-muted/20">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground font-black text-xs flex items-center justify-center shadow-xs">
              SE
            </div>
            <div>
              <DialogTitle className="text-base font-bold tracking-tight text-foreground">
                SE Lab
              </DialogTitle>
            </div>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Sign in with your Student ID to reserve desks and track lab sessions.
          </DialogDescription>

          {/* Mode Switch Tabs */}
          <div className="pt-3">
            <Tabs
              value={activeTab}
              onValueChange={(val) => {
                setActiveTab(val as 'login' | 'register');
                setErrorMsg(null);
              }}
              className="w-full"
            >
              <TabsList className="grid grid-cols-2 w-full h-11 sm:h-9 p-0.5 bg-muted rounded-lg">
                <TabsTrigger
                  value="login"
                  className="text-xs font-semibold data-[state=active]:bg-background cursor-pointer"
                >
                  Sign In
                </TabsTrigger>
                <TabsTrigger
                  value="register"
                  className="text-xs font-semibold data-[state=active]:bg-background cursor-pointer"
                >
                  Register
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </DialogHeader>

        {/* Form Body */}
        <div className="p-4 sm:p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 text-xs rounded-xl border border-destructive/20 bg-destructive/10 text-destructive font-medium">
              {errorMsg}
            </div>
          )}

          {activeTab === 'login' ? (
            /* Sign In Form: ONLY studentId and password */
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="modal-login-studentId" className="text-xs font-semibold">
                  Student ID or Username
                </Label>
                <div className="relative">
                  <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="modal-login-studentId"
                    type="text"
                    placeholder="e.g. 6531501001 or admin"
                    value={loginStudentId}
                    onChange={(e) => setLoginStudentId(e.target.value)}
                    className="pl-9 text-xs font-mono"
                    disabled={isPending}
                    autoComplete="username"
                    autoFocus
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="modal-login-password" className="text-xs font-semibold">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="modal-login-password"
                    type={showLoginPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="pl-9 pr-9 text-xs"
                    disabled={isPending}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-1 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer"
                    aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full text-xs font-bold gap-2 h-11 mt-2 cursor-pointer"
                disabled={isPending}
              >
                {loginMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Signing in…
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>

              <div className="text-center text-xs text-muted-foreground pt-1">
                Don&apos;t have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('register');
                    setErrorMsg(null);
                  }}
                  className="font-bold text-primary hover:underline cursor-pointer"
                >
                  Register here
                </button>
              </div>
            </form>
          ) : (
            /* Register Form: ONLY studentId, fullName, and password */
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="modal-reg-studentId" className="text-xs font-semibold">
                  Student ID
                </Label>
                <div className="relative">
                  <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="modal-reg-studentId"
                    type="text"
                    placeholder="e.g. 6531501001"
                    value={regStudentId}
                    onChange={(e) => setRegStudentId(e.target.value)}
                    className="pl-9 text-xs font-mono"
                    disabled={isPending}
                    autoComplete="username"
                    autoFocus
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="modal-reg-fullname" className="text-xs font-semibold">
                  Full Name
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="modal-reg-fullname"
                    type="text"
                    placeholder="e.g. Alex Chen"
                    value={regFullName}
                    onChange={(e) => setRegFullName(e.target.value)}
                    className="pl-9 text-xs"
                    disabled={isPending}
                    autoComplete="name"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="modal-reg-password" className="text-xs font-semibold">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="modal-reg-password"
                    type={showRegPassword ? 'text' : 'password'}
                    placeholder="Min. 6 characters"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="pl-9 pr-9 text-xs"
                    disabled={isPending}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="absolute right-1 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer"
                    aria-label={showRegPassword ? 'Hide password' : 'Show password'}
                  >
                    {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full text-xs font-bold gap-2 h-11 mt-2 cursor-pointer"
                disabled={isPending}
              >
                {registerMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Registering…
                  </>
                ) : (
                  <>
                    Create Account
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>

              <div className="text-center text-xs text-muted-foreground pt-1">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('login');
                    setErrorMsg(null);
                  }}
                  className="font-bold text-primary hover:underline cursor-pointer"
                >
                  Sign in here
                </button>
              </div>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
