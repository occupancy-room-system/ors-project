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
  MapPin,
  QrCode,
  Clock,
  ShieldAlert,
  LogOut,
  User as UserIcon,
  ChevronDown,
  Layers,
} from 'lucide-react';

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

  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href));

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <Link href={ROUTES.HOME} className="flex items-center gap-3 group focus:outline-none shrink-0">
          <div className="w-9 h-9 rounded-xl bg-primary text-primary-foreground font-black text-sm flex items-center justify-center shadow-xs transition-transform group-hover:scale-105">
            SE
          </div>
          <div className="flex flex-col">
            <span className="text-sm sm:text-base font-extrabold tracking-tight text-foreground group-hover:text-primary transition-colors flex items-center gap-1.5">
              SE Lab Occupancy
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-md bg-muted text-muted-foreground font-medium hidden sm:inline-block">
                Turing 101
              </span>
            </span>
            <span className="text-[10px] text-muted-foreground hidden sm:block">
              Workstation Reservation & Live Monitoring
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          <Link
            href={ROUTES.HOME}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors ${
              isActive(ROUTES.HOME)
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            2D Floor Plan
          </Link>

          <Link
            href={ROUTES.CHECKIN}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors ${
              isActive(ROUTES.CHECKIN)
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            QR Check-In
            {mounted && pendingReservationCount > 0 && (
              <Badge variant="secondary" className="px-1.5 py-0 text-[10px] font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                {pendingReservationCount}
              </Badge>
            )}
          </Link>

          <Link
            href={ROUTES.SESSION}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors ${
              isActive(ROUTES.SESSION)
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            My Session
            {mounted && activeSession && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            )}
          </Link>

          {mounted && currentUser?.role === 'ADMINISTRATOR' && (
            <Link
              href={ROUTES.ADMIN}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors ${
                isActive(ROUTES.ADMIN)
                  ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 font-bold'
                  : 'text-muted-foreground hover:text-amber-600 hover:bg-amber-50/50'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
              Admin Console
            </Link>
          )}
        </nav>

        {/* Auth / Profile */}
        <div className="flex items-center gap-2">
          {!mounted ? (
            <div className="h-9 w-20 rounded-lg bg-muted/50 animate-pulse" />
          ) : currentUser ? (
            <DropdownMenu>
              <DropdownMenuTrigger className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg border border-border/80 bg-background hover:bg-muted/60 transition-colors cursor-pointer">
                <div
                  className={`w-2 h-2 rounded-full ${
                    currentUser.role === 'ADMINISTRATOR' || currentUser.role === 'ROLE_ADMIN'
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                />
                <span className="max-w-[120px] truncate font-semibold">{currentUser.fullName}</span>
                <ChevronDown className="w-3 h-3 text-muted-foreground" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-xs font-bold leading-none text-foreground">{currentUser.fullName}</p>
                    <p className="text-[11px] leading-none text-muted-foreground font-mono truncate">
                      {currentUser.email}
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
              className="h-9 px-4 text-xs font-bold shadow-xs cursor-pointer"
            >
              Sign In
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
