'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ROUTES } from '@/config/routes';
import { useApp } from '@/hooks/use-app-store';
import { useLogoutMutation } from '@/hooks/use-auth-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  LayoutGrid,
  ShieldAlert,
  LogOut,
  User as UserIcon,
  ChevronDown,
  HelpCircle,
  QrCode,
} from 'lucide-react';
import { ThemeToggle } from '@/components/theme/theme-toggle';

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, setCurrentUser, openAuthModal, activeSession, pendingReservationCount, showToast } = useApp();
  const logoutMutation = useLogoutMutation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    setCurrentUser(null);
    showToast('Signed out of laboratory session.', 'info');
    router.push(ROUTES.HOME);
  };

  const isOverview = pathname === ROUTES.HOME;
  const isReservations = pathname === ROUTES.CHECKIN || pathname.startsWith('/checkin');
  const isSession = pathname === ROUTES.SESSION || pathname.startsWith('/session');
  const isAdmin = pathname === ROUTES.ADMIN || pathname.startsWith('/admin');

  // Compute user initials (e.g. "Alex Kim" -> "AK")
  const getInitials = (name?: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-4">
        {/* Left: Brand + Navigation Tabs */}
        <div className="flex items-center gap-8">
          {/* Brand */}
          <Link href={ROUTES.HOME} className="flex items-center gap-2.5 group focus:outline-none shrink-0">
            <div className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-primary transition-transform group-hover:scale-105 shadow-2xs">
              <LayoutGrid className="w-4 h-4" />
            </div>
            <span className="text-sm sm:text-base font-bold tracking-tight text-foreground group-hover:text-primary transition-colors">
              SE Lab Occupancy
            </span>
          </Link>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center h-14 sm:h-16 gap-6">
            {mounted && (currentUser?.role === 'ADMINISTRATOR' || currentUser?.role === 'ROLE_ADMIN') ? (
              <Link
                href={ROUTES.ADMIN}
                className="h-full flex items-center gap-1.5 text-xs sm:text-sm font-bold text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 px-1"
              >
                <ShieldAlert className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                Admin Dashboard Console
              </Link>
            ) : (
              <>
                <Link
                  href={ROUTES.HOME}
                  className={`h-full flex items-center text-xs sm:text-sm font-semibold transition-colors border-b-2 px-1 ${
                    isOverview
                      ? 'border-primary text-primary font-bold'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Lab overview
                </Link>

                <Link
                  href={ROUTES.CHECKIN}
                  className={`h-full flex items-center text-xs sm:text-sm font-semibold transition-colors border-b-2 px-1 relative ${
                    isReservations
                      ? 'border-primary text-primary font-bold'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  My reservations
                  {mounted && pendingReservationCount > 0 && (
                    <span className="ml-1.5 px-1.5 py-0.2 text-[10px] font-extrabold bg-blue-600 text-white rounded-full">
                      {pendingReservationCount}
                    </span>
                  )}
                </Link>

                <Link
                  href={ROUTES.SESSION}
                  className={`h-full flex items-center text-xs sm:text-sm font-semibold transition-colors border-b-2 px-1 relative ${
                    isSession
                      ? 'border-primary text-primary font-bold'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  My session
                  {mounted && activeSession && (
                    <span className="ml-1.5 w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  )}
                </Link>
              </>
            )}
          </nav>
        </div>

        {/* Right: Help icon + User Pill / Sign In */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="w-8 h-8 rounded-full text-muted-foreground hover:text-foreground"
            onClick={() => showToast('Software Engineering Innovation Lab · SE Lab . Open until 22:00.', 'info')}
            title="Help & Lab Information"
          >
            <HelpCircle className="w-4 h-4" />
          </Button>

          <ThemeToggle />

          {!mounted ? (
            <div className="h-8 w-24 rounded-full bg-muted/50 animate-pulse" />
          ) : currentUser ? (
            <DropdownMenu>
              <DropdownMenuTrigger className="inline-flex items-center gap-2 pl-1 pr-2.5 py-1 text-xs font-semibold rounded-full border border-border/80 bg-background hover:bg-muted/50 transition-colors cursor-pointer">
                <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-[10px] font-bold flex items-center justify-center">
                  {getInitials(currentUser.fullName || currentUser.username)}
                </div>
                <span className="max-w-[110px] truncate text-foreground font-medium">
                  {currentUser.fullName || currentUser.username}
                </span>
                <ChevronDown className="w-3 h-3 text-muted-foreground ml-0.5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-xs font-bold leading-none text-foreground">{currentUser.fullName}</p>
                    <p className="text-[11px] leading-none text-muted-foreground font-mono truncate">
                      {currentUser.email || `${currentUser.username}@student.university.edu`}
                    </p>
                    <div className="pt-1">
                      <Badge
                        variant="secondary"
                        className={`text-[9px] font-bold ${
                          currentUser.role === 'ADMINISTRATOR'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                        }`}
                      >
                        {currentUser.role}
                      </Badge>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push(ROUTES.CHECKIN)} className="text-xs gap-2 cursor-pointer">
                  <QrCode className="w-3.5 h-3.5" />
                  Scan Desk QR
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => openAuthModal('student')} className="text-xs gap-2 cursor-pointer">
                  <UserIcon className="w-3.5 h-3.5" />
                  Switch Profile
                </DropdownMenuItem>
                {currentUser.role === 'ADMINISTRATOR' && (
                  <DropdownMenuItem onClick={() => router.push(ROUTES.ADMIN)} className="text-xs gap-2 cursor-pointer">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    Admin Dashboard
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-xs gap-2 text-destructive cursor-pointer">
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              onClick={() => openAuthModal('student')}
              size="sm"
              className="h-8 px-4 text-xs font-bold shadow-xs cursor-pointer rounded-lg"
            >
              Sign In
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
