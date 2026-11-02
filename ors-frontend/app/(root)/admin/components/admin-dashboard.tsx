'use client';

import React, { useState } from 'react';
import QRCode from 'qrcode';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts';
import {
  Seat,
  AnalyticsData,
  OccupancyMapResponse,
  UsageDashboardData,
  UsageInterval,
} from '@/types';
import {
  useAdminAnalyticsQuery,
  useAdminQRCodesQuery,
  useUsageMetricsQuery,
} from '@/hooks/use-admin-query';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  ShieldAlert,
  BarChart3,
  TrendingUp,
  Monitor,
  Printer,
  RefreshCw,
  Clock,
  Users,
  AlertTriangle,
  LogOut,
  Wrench,
  CheckCircle2,
  XCircle,
  FileDown,
} from 'lucide-react';

interface AdminDashboardProps {
  roomData: OccupancyMapResponse;
  onRefresh: () => void;
  onToggleSeatMaintenance: (seat: Seat) => void;
  onTerminateSession: (sessionId: number, reason: string) => Promise<void>;
}

export function AdminDashboard({
  roomData,
  onRefresh,
  onToggleSeatMaintenance,
  onTerminateSession,
}: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'usage' | 'kpi' | 'seats'>('usage');
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [selectedSeatForQr, setSelectedSeatForQr] = useState<string>('ALL');

  // Usage state
  const [usageInterval, setUsageInterval] = useState<UsageInterval>('daily');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  React.useEffect(() => {
    const end = new Date().toISOString().split('T')[0];
    const start = new Date(Date.now() - 14 * 86400000).toISOString().split('T')[0];
    setStartDate(start);
    setEndDate(end);
  }, []);

  // Terminate session dialog state
  const [terminatingSessionId, setTerminatingSessionId] = useState<number | null>(null);
  const [terminateReason, setTerminateReason] = useState<string>(
    'Exceeded time limit / unattended workstation',
  );

  // React Query calls
  const { data: analytics, refetch: refetchAnalytics } = useAdminAnalyticsQuery();
  const { data: usageData, isLoading: usageLoading } = useUsageMetricsQuery({
    interval: usageInterval,
    startDate,
    endDate,
  });

  const [generatedQrs, setGeneratedQrs] = useState<{ seat: Seat; dataUrl: string }[]>([]);
  const [generatingQrs, setGeneratingQrs] = useState(false);

  const openQrModal = async () => {
    setIsQrModalOpen(true);
    setGeneratingQrs(true);
    try {
      const list = await Promise.all(
        roomData.seats.map(async (seat) => {
          const dataUrl = await QRCode.toDataURL(seat.qrToken, {
            width: 200,
            margin: 2,
            color: { dark: '#0f172a', light: '#ffffff' },
          });
          return { seat, dataUrl };
        }),
      );
      setGeneratedQrs(list);
    } catch (e) {
      console.error(e);
    } finally {
      setGeneratingQrs(false);
    }
  };

  const handleConfirmTerminate = async () => {
    if (!terminatingSessionId) return;
    await onTerminateSession(terminatingSessionId, terminateReason);
    setTerminatingSessionId(null);
  };

  // Occupancy rate calculation
  const occupiedCount = roomData.totalSeats - roomData.availableSeats;
  const occupancyPercentage = roomData.totalSeats > 0 ? Math.round((occupiedCount / roomData.totalSeats) * 100) : 0;

  // Filtered QR stickers list
  const filteredQrs = selectedSeatForQr === 'ALL'
    ? generatedQrs
    : generatedQrs.filter((q) => q.seat.podLabel === selectedSeatForQr);

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <Card className="border-border shadow-xs">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30 font-bold text-xs">
                  <ShieldAlert className="w-3.5 h-3.5 mr-1" />
                  Staff Administrator Console
                </Badge>
                <span className="text-xs text-muted-foreground font-mono">
                  Room: {roomData.room.roomCode}
                </span>
              </div>
              <h2 className="text-2xl font-black tracking-tight text-foreground">
                Lab Management & Analytics
              </h2>
              <p className="text-xs text-muted-foreground">
                Turing Hall 101 · Real-time workstation monitoring, session moderation, and student usage metrics.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onRefresh();
                  refetchAnalytics();
                }}
                className="gap-2 text-xs font-semibold h-9"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Refresh Data
              </Button>
              <Button
                size="sm"
                onClick={openQrModal}
                className="gap-2 text-xs font-bold h-9 bg-slate-900 text-white hover:bg-slate-800"
              >
                <Printer className="w-3.5 h-3.5" />
                Desk QR Stickers
              </Button>
            </div>
          </div>

          {/* Quick Metrics Strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 mt-6 border-t border-border/60">
            <div className="space-y-1">
              <span className="text-[11px] text-muted-foreground font-medium">Occupancy Rate</span>
              <div className="text-2xl font-bold font-mono text-foreground">{occupancyPercentage}%</div>
            </div>
            <div className="space-y-1">
              <span className="text-[11px] text-muted-foreground font-medium">Free Desks</span>
              <div className="text-2xl font-bold font-mono text-emerald-600">
                {roomData.availableSeats} / {roomData.totalSeats}
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-[11px] text-muted-foreground font-medium">Occupied Desks</span>
              <div className="text-2xl font-bold font-mono text-rose-600">{roomData.occupiedSeats}</div>
            </div>
            <div className="space-y-1">
              <span className="text-[11px] text-muted-foreground font-medium">Under Maintenance</span>
              <div className="text-2xl font-bold font-mono text-muted-foreground">
                {roomData.seats.filter((s) => s.status === 'MAINTENANCE').length}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as any)} className="space-y-6">
        <TabsList className="grid grid-cols-3 w-full max-w-md h-10 p-1 bg-muted rounded-xl">
          <TabsTrigger value="usage" className="text-xs font-semibold gap-1.5 data-[state=active]:bg-background">
            <TrendingUp className="w-3.5 h-3.5" />
            Usage Reports
          </TabsTrigger>
          <TabsTrigger value="kpi" className="text-xs font-semibold gap-1.5 data-[state=active]:bg-background">
            <BarChart3 className="w-3.5 h-3.5" />
            Real-time KPIs
          </TabsTrigger>
          <TabsTrigger value="seats" className="text-xs font-semibold gap-1.5 data-[state=active]:bg-background">
            <Monitor className="w-3.5 h-3.5" />
            Workstations ({roomData.totalSeats})
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Usage Analytics */}
        <TabsContent value="usage" className="space-y-6">
          <Card className="border-border">
            <CardHeader className="p-6 pb-4 border-b border-border/60">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-base font-bold">Historical Usage Dashboard</CardTitle>
                  <CardDescription className="text-xs">
                    Aggregate laboratory usage hours, user attendance, and duration patterns.
                  </CardDescription>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-1 p-0.5 bg-muted rounded-lg border border-border/60">
                    {(['daily', 'weekly', 'monthly'] as const).map((intVal) => (
                      <Button
                        key={intVal}
                        variant={usageInterval === intVal ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setUsageInterval(intVal)}
                        className="h-7 text-xs capitalize px-2.5"
                      >
                        {intVal}
                      </Button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="h-8 text-xs w-32 font-mono"
                    />
                    <span className="text-xs text-muted-foreground">to</span>
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="h-8 text-xs w-32 font-mono"
                    />
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-6 space-y-6">
              {/* Summary Cards */}
              {usageData?.summary && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 rounded-xl border border-border/80 bg-muted/20 space-y-1">
                    <span className="text-xs text-muted-foreground font-medium">Total Unique Users</span>
                    <div className="text-2xl font-bold font-mono text-foreground">
                      {usageData.summary.totalUsers}
                    </div>
                  </div>
                  <div className="p-4 rounded-xl border border-border/80 bg-muted/20 space-y-1">
                    <span className="text-xs text-muted-foreground font-medium">Cumulative Hours</span>
                    <div className="text-2xl font-bold font-mono text-primary">
                      {usageData.summary.totalUsageHours.toFixed(1)}h
                    </div>
                  </div>
                  <div className="p-4 rounded-xl border border-border/80 bg-muted/20 space-y-1">
                    <span className="text-xs text-muted-foreground font-medium">Total Sessions</span>
                    <div className="text-2xl font-bold font-mono text-foreground">
                      {usageData.summary.totalSessions}
                    </div>
                  </div>
                  <div className="p-4 rounded-xl border border-border/80 bg-muted/20 space-y-1">
                    <span className="text-xs text-muted-foreground font-medium">Avg Session Time</span>
                    <div className="text-2xl font-bold font-mono text-foreground">
                      {usageData.summary.avgSessionMinutes} min
                    </div>
                  </div>
                </div>
              )}

              {/* Area Chart: Timeline */}
              {usageData?.timeline && usageData.timeline.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Usage Timeline ({usageInterval})
                  </h4>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={usageData.timeline}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                        <XAxis dataKey="periodLabel" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#0f172a',
                            borderColor: '#334155',
                            color: '#fff',
                            borderRadius: '8px',
                            fontSize: '12px',
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="totalHours"
                          name="Total Hours"
                          stroke="#2563eb"
                          fill="#3b82f6"
                          fillOpacity={0.2}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Top Users Table */}
              {usageData?.topUsers && usageData.topUsers.length > 0 && (
                <div className="space-y-3 pt-4 border-t border-border/60">
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Top Active Students
                  </h4>
                  <div className="rounded-xl border border-border overflow-hidden">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-muted/50 border-b border-border text-muted-foreground font-semibold">
                        <tr>
                          <th className="py-2.5 px-4">Student Name</th>
                          <th className="py-2.5 px-4">Email</th>
                          <th className="py-2.5 px-4">Sessions</th>
                          <th className="py-2.5 px-4 text-right">Total Hours</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {usageData.topUsers.map((u) => (
                          <tr key={u.userId} className="hover:bg-muted/30 transition-colors">
                            <td className="py-2.5 px-4 font-bold text-foreground">{u.userName}</td>
                            <td className="py-2.5 px-4 text-muted-foreground font-mono">{u.userEmail}</td>
                            <td className="py-2.5 px-4 font-mono">{u.sessionCount}</td>
                            <td className="py-2.5 px-4 font-mono font-bold text-right text-primary">
                              {u.totalHours.toFixed(1)}h
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Real-time KPIs */}
        <TabsContent value="kpi" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Hourly Occupancy Rate */}
            <Card className="border-border">
              <CardHeader className="p-5 pb-3 border-b border-border/60">
                <CardTitle className="text-sm font-bold">Hourly Occupancy Peak Rate</CardTitle>
                <CardDescription className="text-xs">Desks occupied throughout lab operating hours.</CardDescription>
              </CardHeader>
              <CardContent className="p-5">
                <div className="h-60 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics?.hourlyOccupancy || []}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis dataKey="hour" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} unit="%" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          borderColor: '#334155',
                          color: '#fff',
                          borderRadius: '8px',
                          fontSize: '12px',
                        }}
                      />
                      <Bar dataKey="rate" name="Occupancy %" fill="#2563eb" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Pod Utilization */}
            <Card className="border-border">
              <CardHeader className="p-5 pb-3 border-b border-border/60">
                <CardTitle className="text-sm font-bold">Pod & Station Utilization Rate</CardTitle>
                <CardDescription className="text-xs">Comparative utilization by station zone.</CardDescription>
              </CardHeader>
              <CardContent className="p-5">
                <div className="h-60 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics?.podUtilization || []} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis type="number" tick={{ fontSize: 11 }} unit="%" />
                      <YAxis type="category" dataKey="pod" tick={{ fontSize: 11 }} width={80} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          borderColor: '#334155',
                          color: '#fff',
                          borderRadius: '8px',
                          fontSize: '12px',
                        }}
                      />
                      <Bar dataKey="rate" name="Utilization %" fill="#10b981" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 3: Workstations Table */}
        <TabsContent value="seats" className="space-y-4">
          <Card className="border-border">
            <CardHeader className="p-5 pb-3 border-b border-border/60">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold">Workstations Roster</CardTitle>
                  <CardDescription className="text-xs">
                    Live status and admin override actions for all 54 workstations.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted/50 border-b border-border text-muted-foreground font-semibold">
                    <tr>
                      <th className="py-2.5 px-4">Desk</th>
                      <th className="py-2.5 px-4">Zone</th>
                      <th className="py-2.5 px-4">Status</th>
                      <th className="py-2.5 px-4">Occupant / Session</th>
                      <th className="py-2.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {roomData.seats.map((seat) => (
                      <tr key={seat.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-2.5 px-4 font-bold font-mono">{seat.seatCode}</td>
                        <td className="py-2.5 px-4 text-muted-foreground">{seat.podLabel}</td>
                        <td className="py-2.5 px-4">
                          <Badge
                            variant="outline"
                            className={`text-[9px] font-bold ${
                              seat.status === 'AVAILABLE'
                                ? 'border-emerald-300 text-emerald-700 bg-emerald-50'
                                : seat.status === 'OCCUPIED'
                                ? 'border-rose-300 text-rose-700 bg-rose-50'
                                : seat.status === 'RESERVED'
                                ? 'border-indigo-300 text-indigo-700 bg-indigo-50'
                                : 'text-muted-foreground'
                            }`}
                          >
                            {seat.status}
                          </Badge>
                        </td>
                        <td className="py-2.5 px-4 text-muted-foreground">
                          {seat.currentSession?.userName ? (
                            <span className="font-semibold text-foreground">
                              {seat.currentSession.userName} ({seat.currentSession.minutesRemaining}m left)
                            </span>
                          ) : seat.currentReservation?.userName ? (
                            <span className="text-indigo-600 font-medium">
                              Reserved by {seat.currentReservation.userName}
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="py-2.5 px-4 text-right space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onToggleSeatMaintenance(seat)}
                            className="h-7 text-[11px] gap-1"
                          >
                            <Wrench className="w-3 h-3" />
                            {seat.status === 'MAINTENANCE' ? 'Set Active' : 'Maintenance'}
                          </Button>

                          {seat.currentSession && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => setTerminatingSessionId(seat.currentSession!.sessionId)}
                              className="h-7 text-[11px] gap-1 font-bold"
                            >
                              <LogOut className="w-3 h-3" />
                              Terminate
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Terminate Session Dialog */}
      <Dialog open={!!terminatingSessionId} onOpenChange={(open) => !open && setTerminatingSessionId(null)}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground">
              Terminate Active Student Session
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground pt-1">
              Are you sure you want to forcibly terminate this student session? The workstation will be released immediately.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-1.5 py-2">
            <label className="text-xs font-semibold text-foreground">Reason for termination:</label>
            <Input
              value={terminateReason}
              onChange={(e) => setTerminateReason(e.target.value)}
              className="text-xs"
            />
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setTerminatingSessionId(null)} className="text-xs">
              Cancel
            </Button>
            <Button variant="destructive" size="sm" onClick={handleConfirmTerminate} className="text-xs font-bold">
              Confirm Termination
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Desk QR Stickers Modal */}
      <Dialog open={isQrModalOpen} onOpenChange={setIsQrModalOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <Printer className="w-4 h-4 text-primary" />
              Physical Desk QR Stickers Generator
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              High-resolution scannable QR vectors for physical workstations at Turing Hall 101.
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center justify-between gap-4 py-2 border-b border-border/60">
            <div className="flex items-center gap-1.5 flex-wrap">
              {['ALL', 'Station A', 'Station B', 'Station C', 'Station D', 'Station E'].map((pod) => (
                <Button
                  key={pod}
                  variant={selectedSeatForQr === pod ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedSeatForQr(pod)}
                  className="h-7 text-xs font-semibold"
                >
                  {pod}
                </Button>
              ))}
            </div>

            <Button
              size="sm"
              onClick={() => window.print()}
              className="h-8 text-xs font-bold gap-1.5 bg-slate-900 text-white"
            >
              <Printer className="w-3.5 h-3.5" />
              Print Stickers
            </Button>
          </div>

          {generatingQrs ? (
            <div className="p-8 text-center text-xs text-muted-foreground font-mono">
              Rendering QR codes...
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 py-3">
              {filteredQrs.map(({ seat, dataUrl }) => (
                <div
                  key={seat.id}
                  className="p-3 bg-white text-slate-900 rounded-xl border border-slate-200 text-center flex flex-col items-center space-y-1 shadow-xs"
                >
                  <span className="text-[9px] font-bold uppercase tracking-wider text-blue-700">
                    SE Lab 101
                  </span>
                  <div className="text-sm font-extrabold">{seat.seatCode}</div>
                  <span className="text-[10px] text-slate-500 font-medium">{seat.podLabel}</span>

                  <img
                    src={dataUrl}
                    alt={`QR code for ${seat.seatCode}`}
                    className="w-24 h-24 object-contain my-1"
                  />

                  <span className="text-[8px] font-mono text-slate-400 block truncate max-w-full">
                    {seat.qrToken}
                  </span>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
