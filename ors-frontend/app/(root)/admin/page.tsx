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

export default function AdminPage() {
  const router = useRouter();
  const { currentUser, roomData, loadData, openAuthModal } = useApp();
  const { handleToggleMaintenance, handleTerminateSession } = useActions();

  if (currentUser?.role !== 'ADMINISTRATOR' && currentUser?.role !== 'ROLE_ADMIN') {
    return (
      <div className="max-w-md mx-auto my-12">
        <Card className="border-border shadow-md text-center">
          <CardContent className="pt-8 pb-8 space-y-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 flex items-center justify-center">
              <ShieldAlert className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <Badge variant="outline" className="text-[10px] font-bold border-amber-400 text-amber-800 bg-amber-50">
                Staff Restricted Area
              </Badge>
              <h2 className="text-xl font-extrabold text-foreground tracking-tight pt-1">
                Admin Console Portal
              </h2>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-sm mx-auto">
                The Laboratory Administration Console is strictly restricted to University Lab Technicians and Faculty Administrators.
              </p>
            </div>

            {currentUser ? (
              <div className="p-3.5 bg-muted/40 rounded-xl border border-border text-xs text-left space-y-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                  Current Account
                </span>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-foreground">{currentUser.fullName}</span>
                  <Badge variant="secondary" className="text-[10px] font-mono">
                    {currentUser.role}
                  </Badge>
                </div>
                <p className="text-[11px] text-destructive pt-1 font-medium">
                  Your student account does not have administrator privileges.
                </p>
              </div>
            ) : (
              <div className="p-3.5 bg-muted/40 rounded-xl border border-border text-xs text-left">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                  Current Status
                </span>
                <p className="text-muted-foreground mt-0.5">
                  You are currently browsing as a <strong>Guest</strong>.
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
              <Button
                onClick={() => openAuthModal('admin')}
                size="sm"
                className="text-xs font-bold gap-2 bg-slate-900 text-white hover:bg-slate-800"
              >
                <KeyRound className="w-3.5 h-3.5" />
                Sign In as Admin
              </Button>
              <Button
                onClick={() => router.push(ROUTES.HOME)}
                variant="outline"
                size="sm"
                className="text-xs font-semibold gap-2"
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

