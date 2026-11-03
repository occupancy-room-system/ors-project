'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/config/routes';
import { useApp } from '@/hooks/use-app-store';
import { useActions } from '@/hooks/use-actions';
import { AdminDashboard } from './components/admin-dashboard';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShieldAlert, ArrowLeft, KeyRound } from 'lucide-react';
import { ThemeToggle } from '@/components/theme/theme-toggle';

export default function AdminPage() {
  const router = useRouter();
  const { currentUser, roomData, loadData, openAuthModal } = useApp();
  const { handleToggleMaintenance, handleTerminateSession } = useActions();

  if (currentUser?.role !== 'ADMINISTRATOR' && currentUser?.role !== 'ROLE_ADMIN') {
    return (
      <div className="min-h-screen w-full flex items-center justify-center p-4 bg-[#f8fafc] dark:bg-[#0b0f19] relative">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>
        <Card className="w-full max-w-md border-[#edf1f7] dark:border-[#1f293d] bg-white dark:bg-[#111827] shadow-[0_4px_20px_rgba(0,0,0,0.03)] text-center rounded-2xl">
          <CardContent className="pt-8 pb-8 space-y-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-[#f0f5ff] dark:bg-blue-950/60 text-[#4a7cf6] dark:text-blue-400 flex items-center justify-center shadow-xs">
              <ShieldAlert className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <Badge variant="outline" className="text-[10px] font-bold border-amber-300 text-amber-800 bg-amber-50">
                Staff Restricted Area
              </Badge>
              <h2 className="text-xl font-extrabold text-slate-800 dark:text-white tracking-tight pt-1">
                Admin Console Portal
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm mx-auto">
                The Laboratory Administration Console is strictly restricted to University Lab Technicians and Faculty Administrators.
              </p>
            </div>

            {currentUser ? (
              <div className="p-3.5 bg-[#f8fafc] dark:bg-slate-900/60 rounded-xl border border-[#edf1f7] dark:border-slate-800 text-xs text-left space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Current Account
                </span>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 dark:text-white">{currentUser.fullName}</span>
                  <Badge variant="secondary" className="text-[10px] font-mono font-bold bg-[#f0f5ff] text-[#4070d8]">
                    {currentUser.role}
                  </Badge>
                </div>
                <p className="text-[11px] text-destructive pt-1 font-medium">
                  Your student account does not have administrator privileges.
                </p>
              </div>
            ) : (
              <div className="p-3.5 bg-[#f8fafc] dark:bg-slate-900/60 rounded-xl border border-[#edf1f7] dark:border-slate-800 text-xs text-left">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Current Status
                </span>
                <p className="text-slate-500 mt-0.5">
                  You are currently browsing as a <strong className="text-slate-800 dark:text-slate-200">Guest</strong>.
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
              <Button
                onClick={() => openAuthModal('admin')}
                size="sm"
                className="text-xs font-bold gap-2 bg-[#4a7cf6] text-white hover:bg-[#3d6fe8] rounded-xl shadow-sm shadow-[#4a7cf6]/20 cursor-pointer"
              >
                <KeyRound className="w-3.5 h-3.5" />
                Sign In as Admin
              </Button>
              <Button
                onClick={() => router.push(ROUTES.HOME)}
                variant="outline"
                size="sm"
                className="text-xs font-semibold gap-2 rounded-xl border-[#edf1f7] hover:bg-slate-50"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Return to Floor Plan
              </Button>
            </div>
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

