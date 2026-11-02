'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/hooks/use-app-store';
import { useLoginMutation } from '@/hooks/use-auth-query';
import { User } from '@/types';
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
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GraduationCap, ShieldCheck, UserCheck, ArrowRight, Eye, EyeOff, Loader2 } from 'lucide-react';

const PRESET_STUDENTS: User[] = [
  { id: 2, fullName: 'Alex Chen', email: 'alex.chen@student.university.edu', role: 'STUDENT', accountStatus: 'ACTIVE' },
  { id: 3, fullName: 'Sarah Kim', email: 'sarah.kim@student.university.edu', role: 'STUDENT', accountStatus: 'ACTIVE' },
  { id: 4, fullName: 'Marcus Taylor', email: 'marcus.taylor@student.university.edu', role: 'STUDENT', accountStatus: 'ACTIVE' },
];

const ADMIN_USER: User = {
  id: 1,
  fullName: 'Prof. Robert Vance',
  email: 'admin@university.edu',
  role: 'ADMINISTRATOR',
  accountStatus: 'ACTIVE',
};

export function AuthModal() {
  const { isAuthModalOpen, authModalPortal, closeAuthModal, setCurrentUser, showToast } = useApp();
  const router = useRouter();
  const loginMutation = useLoginMutation();

  const [activePortal, setActivePortal] = useState<'student' | 'admin'>(authModalPortal);
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthModalOpen) {
      setActivePortal(authModalPortal);
      setErrorMsg(null);
      setPasswordInput('');
    }
  }, [isAuthModalOpen, authModalPortal]);

  const handleSelectPreset = (user: User) => {
    setCurrentUser(user);
    showToast(`Signed in as ${user.fullName} (${user.role})`, 'success');
    closeAuthModal();
    if (user.role === 'ADMINISTRATOR' || user.role === 'ROLE_ADMIN') {
      router.push(ROUTES.ADMIN);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const identifier = emailInput.trim();
    if (!identifier) {
      setErrorMsg('Please enter your email or username.');
      return;
    }

    try {
      if (passwordInput) {
        const { user } = await loginMutation.mutateAsync({
          usernameOrEmail: identifier,
          password: passwordInput,
        });
        setCurrentUser(user);
        showToast(`Welcome back, ${user.fullName}!`, 'success');
        closeAuthModal();
        if (user.role === 'ADMINISTRATOR' || user.role === 'ROLE_ADMIN') {
          router.push(ROUTES.ADMIN);
        }
      } else {
        // Quick demo login matching preset or generating mock student session
        const found =
          activePortal === 'admin'
            ? ADMIN_USER
            : PRESET_STUDENTS.find((u) => u.email.toLowerCase() === identifier.toLowerCase());

        handleSelectPreset(
          found ?? {
            id: Date.now(),
            fullName: identifier.split('@')[0].replace('.', ' ').toUpperCase(),
            email: identifier,
            role: activePortal === 'admin' ? 'ADMINISTRATOR' : 'STUDENT',
            accountStatus: 'ACTIVE',
          },
        );
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Authentication failed.');
    }
  };

  return (
    <Dialog open={isAuthModalOpen} onOpenChange={(open) => !open && closeAuthModal()}>
      <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden border-border bg-card">
        <DialogHeader className="p-6 pb-4 border-b border-border/60 bg-muted/30">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground font-black text-xs flex items-center justify-center shadow-xs">
              SE
            </div>
            <DialogTitle className="text-base font-bold tracking-tight">University Lab Access</DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Sign in to reserve engineering workstations or manage lab occupancy.
          </DialogDescription>

          <div className="pt-3">
            <Tabs
              value={activePortal}
              onValueChange={(val) => {
                setActivePortal(val as 'student' | 'admin');
                setErrorMsg(null);
              }}
              className="w-full"
            >
              <TabsList className="grid grid-cols-2 w-full h-9 p-0.5 bg-muted rounded-lg">
                <TabsTrigger value="student" className="text-xs font-semibold gap-1.5 data-[state=active]:bg-background">
                  <GraduationCap className="w-3.5 h-3.5" />
                  Student Portal
                </TabsTrigger>
                <TabsTrigger value="admin" className="text-xs font-semibold gap-1.5 data-[state=active]:bg-background">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Admin Console
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3 text-xs rounded-lg border border-destructive/20 bg-destructive/10 text-destructive font-medium">
              {errorMsg}
            </div>
          )}

          {activePortal === 'student' ? (
            <div className="space-y-4">
              <div>
                <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-2">
                  1-Click Student Profiles
                </Label>
                <div className="grid gap-2">
                  {PRESET_STUDENTS.map((student) => (
                    <button
                      key={student.id}
                      type="button"
                      onClick={() => handleSelectPreset(student)}
                      className="w-full flex items-center justify-between p-2.5 rounded-lg border border-border/80 bg-background hover:bg-muted/50 transition-colors text-left group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0">
                          {student.fullName
                            .split(' ')
                            .map((n) => n[0])
                            .join('')}
                        </div>
                        <div className="truncate">
                          <div className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                            {student.fullName}
                          </div>
                          <div className="text-[11px] text-muted-foreground font-mono truncate">{student.email}</div>
                        </div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-transform group-hover:translate-x-0.5 shrink-0" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="relative flex items-center py-1">
                <div className="flex-grow border-t border-border" />
                <span className="shrink-0 px-2 text-[10px] uppercase font-bold text-muted-foreground">or credentials</span>
                <div className="flex-grow border-t border-border" />
              </div>

              <form onSubmit={handleFormSubmit} className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="student-email" className="text-xs">
                    University Email / Username
                  </Label>
                  <Input
                    id="student-email"
                    type="text"
                    placeholder="student.id@university.edu"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="student-password" className="text-xs">
                    Password (Optional for quick login)
                  </Label>
                  <div className="relative">
                    <Input
                      id="student-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      className="h-9 text-xs pr-8"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
                <Button type="submit" size="sm" className="w-full h-9 text-xs font-bold" disabled={loginMutation.isPending}>
                  {loginMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : null}
                  Continue to Workstations
                </Button>
              </form>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-3 rounded-lg border border-amber-500/20 bg-amber-500/10 text-amber-900 dark:text-amber-200">
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  Staff Restricted Console
                </div>
                <p className="text-[11px] text-amber-800/90 dark:text-amber-300/80 mt-1 leading-relaxed">
                  Laboratory Supervisors and Faculty Administrators can sign in below.
                </p>
              </div>

              <div>
                <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-2">
                  Authorized Admin Profile
                </Label>
                <button
                  type="button"
                  onClick={() => handleSelectPreset(ADMIN_USER)}
                  className="w-full flex items-center justify-between p-3 rounded-lg border border-amber-300/80 bg-amber-50/50 dark:bg-amber-950/20 hover:bg-amber-100/60 dark:hover:bg-amber-900/30 transition-colors text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-amber-600 text-white font-bold text-xs flex items-center justify-center">
                      RV
                    </div>
                    <div>
                      <div className="text-xs font-bold text-foreground flex items-center gap-2">
                        {ADMIN_USER.fullName}
                        <Badge variant="outline" className="text-[9px] border-amber-400 text-amber-800 dark:text-amber-300">
                          FACULTY
                        </Badge>
                      </div>
                      <div className="text-[11px] text-muted-foreground font-mono mt-0.5">{ADMIN_USER.email}</div>
                    </div>
                  </div>
                  <UserCheck className="w-4 h-4 text-amber-600 group-hover:scale-110 transition-transform" />
                </button>
              </div>

              <form onSubmit={handleFormSubmit} className="space-y-3 pt-1">
                <div className="space-y-1.5">
                  <Label htmlFor="admin-key" className="text-xs">
                    Admin Passkey or Email
                  </Label>
                  <Input
                    id="admin-key"
                    type="password"
                    placeholder="admin@university.edu or passkey"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    className="h-9 text-xs font-mono"
                  />
                </div>
                <Button type="submit" size="sm" className="w-full h-9 text-xs font-bold bg-slate-900 text-white hover:bg-slate-800">
                  Verify Administrator Key
                </Button>
              </form>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

