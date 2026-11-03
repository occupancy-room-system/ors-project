'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLoginMutation } from '@/hooks/use-auth-query';
import { useApp } from '@/hooks/use-app-store';
import { ROUTES } from '@/config/routes';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock, Eye, EyeOff, Loader2, ArrowRight, ArrowLeft, GraduationCap, UserCheck, ShieldCheck } from 'lucide-react';
import { ThemeToggle } from '@/components/theme/theme-toggle';

export default function LoginPage() {
  const router = useRouter();
  const { setCurrentUser, showToast } = useApp();
  const loginMutation = useLoginMutation();

  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId.trim()) {
      setErrorMsg('Please enter your Student ID.');
      return;
    }
    if (!password) {
      setErrorMsg('Please enter your password.');
      return;
    }

    setErrorMsg(null);
    try {
      const { user } = await loginMutation.mutateAsync({
        studentId: studentId.trim(),
        password,
      });

      setCurrentUser(user);
      showToast(`Welcome back, ${user.fullName || user.username}!`, 'success');

      if (user.role === 'ADMINISTRATOR' || user.role === 'ROLE_ADMIN') {
        router.push(ROUTES.ADMIN);
      } else {
        router.push(ROUTES.HOME);
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Invalid Student ID or password. Please try again.');
    }
  };

  const handleQuickLogin = (id: string, role: string, name: string) => {
    const user = {
      id: role === 'ADMINISTRATOR' ? 1 : 2,
      fullName: name,
      username: id,
      email: id === 'admin' ? 'admin@gmail.com' : `${id}@student.university.edu`,
      role: role as any,
      accountStatus: 'ACTIVE' as const,
    };
    setCurrentUser(user);
    showToast(`Signed in as ${name}`, 'success');
    if (role === 'ADMINISTRATOR') {
      router.push(ROUTES.ADMIN);
    } else {
      router.push(ROUTES.HOME);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/20 relative">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md space-y-6">
        {/* Back Link */}
        <Link
          href={ROUTES.HOME}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Floor Plan
        </Link>

        {/* Brand */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary text-primary-foreground font-black text-lg shadow-sm">
            SE
          </div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">Sign In</h1>
          <p className="text-xs text-muted-foreground">
            Sign in with your Student ID to access SE lab workstations
          </p>
        </div>

        {/* Main Card */}
        <Card className="border-border shadow-xs">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-bold">Student Sign In</CardTitle>
            <CardDescription className="text-xs">
              Enter your Student ID and password to proceed.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {errorMsg && (
              <div className="p-3 text-xs rounded-xl border border-destructive/20 bg-destructive/10 text-destructive font-medium">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Student ID */}
              <div className="space-y-1.5">
                <Label htmlFor="login-studentId" className="text-xs font-semibold">
                  Student ID
                </Label>
                <div className="relative">
                  <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="login-studentId"
                    type="text"
                    placeholder="e.g. 6531501001"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    className="pl-9 text-xs"
                    disabled={loginMutation.isPending}
                    autoComplete="username"
                    autoFocus
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="login-password" className="text-xs font-semibold">
                    Password
                  </Label>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9 pr-9 text-xs"
                    disabled={loginMutation.isPending}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full text-xs font-bold gap-2 h-10 mt-2 cursor-pointer"
                disabled={loginMutation.isPending}
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
            </form>

            {/* Quick Demo Switchers */}
            <div className="pt-2">
              <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-border" />
                <span className="shrink-0 px-2 text-[10px] uppercase font-bold text-muted-foreground">
                  Quick Demo Access
                </span>
                <div className="flex-grow border-t border-border" />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickLogin('6531501001', 'STUDENT', 'Alex Chen')}
                  className="h-8 text-xs font-semibold gap-1.5 cursor-pointer"
                >
                  <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                  Alex (6531501001)
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickLogin('admin', 'ADMINISTRATOR', 'Prof. Robert Vance')}
                  className="h-8 text-xs font-semibold gap-1.5 cursor-pointer"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                  Admin Vance
                </Button>
              </div>
            </div>
          </CardContent>

          <CardFooter className="pt-0 justify-center">
            <p className="text-xs text-muted-foreground">
              Don&apos;t have an account?{' '}
              <Link href={ROUTES.REGISTER} className="text-primary font-bold hover:underline">
                Register here
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
