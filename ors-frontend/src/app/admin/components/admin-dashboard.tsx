import React, { useState, useEffect, useCallback } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  Legend,
  Line,
} from "recharts";
import {
  Seat,
  AnalyticsData,
  OccupancyMapResponse,
  UsageDashboardData,
  UsageInterval,
} from "@/types";
import { adminService } from "@/services";

interface AdminDashboardProps {
  roomData: OccupancyMapResponse | null;
  onRefresh: () => void;
  onToggleSeatMaintenance: (seat: Seat) => void;
  onTerminateSession: (sessionId: number, reason: string) => Promise<void>;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  roomData,
  onRefresh,
  onToggleSeatMaintenance,
  onTerminateSession,
}) => {
  const [activeTab, setActiveTab] = useState<
    "usage" | "kpi" | "sessions" | "seats" | "qrcodes"
  >("usage");
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [qrList, setQrList] = useState<{ seat: Seat; qrDataUrl: string }[]>([]);
  const [selectedSeatForQr, setSelectedSeatForQr] = useState<string>("ALL");
  const [terminateReason, setTerminateReason] = useState<string>(
    "Exceeded time limit / unattended workstation",
  );
  const [terminatingSessionId, setTerminatingSessionId] = useState<
    number | null
  >(null);

  // Usage Dashboard State
  const [usageInterval, setUsageInterval] = useState<UsageInterval>("daily");
  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date(Date.now() - 14 * 86400000);
    return d.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState<string>(() => {
    return new Date().toISOString().split("T")[0];
  });
  const [usageData, setUsageData] = useState<UsageDashboardData | null>(null);
  const [usageLoading, setUsageLoading] = useState<boolean>(true);
  const [chartView, setChartView] = useState<"hours" | "users" | "both">(
    "both",
  );

  // Load real-time analytics & QR codes
  useEffect(() => {
    adminService.getAnalytics().then(setAnalytics).catch(console.error);
    adminService.getAllQRCodes().then(setQrList).catch(console.error);
  }, []);

  // Fetch Usage Metrics from server
  const fetchUsageMetrics = useCallback(
    async (intVal: UsageInterval, start: string, end: string) => {
      try {
        setUsageLoading(true);
        const data = await adminService.getUsageMetrics({
          interval: intVal,
          startDate: start,
          endDate: end,
        });
        setUsageData(data);
      } catch (err) {
        console.error("Failed to load usage metrics:", err);
      } finally {
        setUsageLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    fetchUsageMetrics(usageInterval, startDate, endDate);
  }, [usageInterval, startDate, endDate, fetchUsageMetrics]);

  // Handle Preset ranges
  const handleSelectPreset = (
    days: number,
    preferredInterval: UsageInterval = "daily",
  ) => {
    const end = new Date().toISOString().split("T")[0];
    const start = new Date(Date.now() - days * 86400000)
      .toISOString()
      .split("T")[0];
    setStartDate(start);
    setEndDate(end);
    setUsageInterval(preferredInterval);
  };

  if (!roomData) return null;

  const activeSessions = roomData.seats.filter((s) => s.currentSession);
  const expiringSoonCount = roomData.seats.filter(
    (s) => s.status === "EXPIRING_SOON",
  ).length;
  const maintenanceCount = roomData.seats.filter(
    (s) => s.status === "MAINTENANCE",
  ).length;
  const reservedCount =
    roomData.reservedSeats ||
    roomData.seats.filter((s) => s.status === "RESERVED").length;

  return (
    <div className="space-y-6">
      {/* Top Header & Sub-Navigation */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
              Administrative Console
            </span>
            <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-slate-100 text-slate-700 rounded border border-slate-200">
              Host Port 3307 Live Sync
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 mt-0.5">
            SE Innovation Lab 101 Administration
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Usage trends, total student counts, cumulative time tracking, live
            occupancy, and seat controls.
          </p>
        </div>

        {/* Tab Switcher - Clean Segmented Control */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl text-xs font-medium w-full md:w-auto overflow-x-auto">
          <button
            onClick={() => setActiveTab("usage")}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
              activeTab === "usage"
                ? "bg-white text-blue-700 shadow-2xs font-extrabold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <span>📊</span>
            <span>Usage Dashboard</span>
          </button>
          <button
            onClick={() => setActiveTab("kpi")}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
              activeTab === "kpi"
                ? "bg-white text-blue-700 shadow-2xs font-extrabold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <span>⚡</span>
            <span>Real-Time KPIs</span>
          </button>
          <button
            onClick={() => setActiveTab("sessions")}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
              activeTab === "sessions"
                ? "bg-white text-slate-900 shadow-2xs font-extrabold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <span>🔴</span>
            <span>Live Sessions ({activeSessions.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("seats")}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
              activeTab === "seats"
                ? "bg-white text-slate-900 shadow-2xs font-extrabold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <span>🖥️</span>
            <span>Workstations ({roomData.seats.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("qrcodes")}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
              activeTab === "qrcodes"
                ? "bg-white text-slate-900 shadow-2xs font-extrabold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <span>🏷️</span>
            <span>QR Label Generator</span>
          </button>
        </div>
      </div>

      {/* ============================================================================== */}
      {/* TAB 1: USAGE DASHBOARD (TOTAL USERS & TOTAL USAGE TIME WITH DATE RANGE) */}
      {/* ============================================================================== */}
      {activeTab === "usage" && (
        <div className="space-y-6">
          {/* Controls Bar: Interval View (Daily, Weekly, Monthly) + Date Range Selector */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* Granularity Switcher (Daily, Weekly, Monthly) */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Aggregation View
                </span>
                <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setUsageInterval("daily")}
                    className={`px-3 sm:px-4 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                      usageInterval === "daily"
                        ? "bg-white text-blue-700 shadow-2xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <span>📅</span>
                    <span>Daily</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setUsageInterval("weekly")}
                    className={`px-3 sm:px-4 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                      usageInterval === "weekly"
                        ? "bg-white text-blue-700 shadow-2xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <span>📆</span>
                    <span>Weekly</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setUsageInterval("monthly")}
                    className={`px-3 sm:px-4 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                      usageInterval === "monthly"
                        ? "bg-white text-blue-700 shadow-2xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <span>🗓️</span>
                    <span>Monthly</span>
                  </button>
                </div>
              </div>

              {/* Quick Presets */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Quick Presets
                </span>
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  <button
                    onClick={() => handleSelectPreset(7, "daily")}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer transition-colors"
                  >
                    Last 7 Days
                  </button>
                  <button
                    onClick={() => handleSelectPreset(14, "daily")}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer transition-colors"
                  >
                    Last 14 Days
                  </button>
                  <button
                    onClick={() => handleSelectPreset(30, "daily")}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer transition-colors"
                  >
                    Last 30 Days
                  </button>
                  <button
                    onClick={() => handleSelectPreset(56, "weekly")}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer transition-colors"
                  >
                    Last 8 Weeks
                  </button>
                  <button
                    onClick={() => handleSelectPreset(90, "monthly")}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer transition-colors"
                  >
                    Last 90 Days
                  </button>
                </div>
              </div>

              {/* Custom Date Range Selectors */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Selectable Date Range
                </span>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-xl text-xs font-mono">
                    <span className="text-slate-400 text-[10px]">From</span>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="bg-transparent text-slate-800 font-bold focus:outline-none cursor-pointer"
                    />
                  </div>
                  <span className="text-slate-400">→</span>
                  <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-xl text-xs font-mono">
                    <span className="text-slate-400 text-[10px]">To</span>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="bg-transparent text-slate-800 font-bold focus:outline-none cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Active Range Notice */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                <span>
                  Filtering {usageInterval} metrics between{" "}
                  <strong className="text-slate-800 font-mono">
                    {startDate}
                  </strong>{" "}
                  and{" "}
                  <strong className="text-slate-800 font-mono">
                    {endDate}
                  </strong>
                </span>
              </div>
              {usageLoading && (
                <span className="text-blue-600 font-mono font-medium animate-pulse">
                  Calculating usage ledger...
                </span>
              )}
            </div>
          </div>

          {/* Primary Metric KPI Cards Strip (Total Users & Total Usage Time) */}
          {usageData && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* 1. Total Number of Users */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Total Number of Users
                  </span>
                  <span className="p-2 rounded-xl bg-blue-50 text-blue-600 text-lg">
                    👥
                  </span>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-3xl sm:text-4xl font-extrabold font-mono text-slate-900 tabular-nums">
                    {usageData.summary.totalUsers}
                  </span>
                  <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                    Students
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1.5">
                  Unique students logged in the laboratory during this period.
                </p>
              </div>

              {/* 2. Total Usage Time */}
              <div className="bg-white p-5 rounded-2xl border border-emerald-200/90 bg-emerald-50/20 shadow-xs relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                    Total Usage Time
                  </span>
                  <span className="p-2 rounded-xl bg-emerald-100/80 text-emerald-700 text-lg">
                    ⏱️
                  </span>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-3xl sm:text-4xl font-extrabold font-mono text-emerald-600 tabular-nums">
                    {usageData.summary.totalUsageHours}
                  </span>
                  <span className="text-sm font-bold text-emerald-700">
                    Hours
                  </span>
                </div>
                <p className="text-xs text-emerald-800/80 mt-1.5 font-mono tabular-nums">
                  {Math.floor(usageData.summary.totalUsageMinutes / 60)}h{" "}
                  {usageData.summary.totalUsageMinutes % 60}m cumulative
                  duration
                </p>
              </div>

              {/* 3. Average Usage per User */}
              <div className="bg-white p-5 rounded-2xl border border-indigo-200/90 bg-indigo-50/20 shadow-xs relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-800 uppercase tracking-wider">
                    Avg Usage / Student
                  </span>
                  <span className="p-2 rounded-xl bg-indigo-100/80 text-indigo-700 text-lg">
                    📈
                  </span>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-3xl sm:text-4xl font-extrabold font-mono text-indigo-600 tabular-nums">
                    {(usageData.summary.avgUserMinutes / 60).toFixed(1)}
                  </span>
                  <span className="text-sm font-bold text-indigo-700">
                    Hours
                  </span>
                </div>
                <p className="text-xs text-indigo-800/80 mt-1.5">
                  Average cumulative time spent per individual student.
                </p>
              </div>

              {/* 4. Total Lab Sessions */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Total Lab Sessions
                  </span>
                  <span className="p-2 rounded-xl bg-slate-100 text-slate-700 text-lg">
                    🪑
                  </span>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-3xl sm:text-4xl font-extrabold font-mono text-slate-900 tabular-nums">
                    {usageData.summary.totalSessions}
                  </span>
                  <span className="text-sm font-bold text-slate-600">
                    Check-ins
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1.5">
                  Mean session length:{" "}
                  <strong className="text-slate-800 font-mono">
                    {usageData.summary.avgSessionMinutes} minutes
                  </strong>
                </p>
              </div>
            </div>
          )}

          {/* Interactive Usage Timeline Chart */}
          {usageData && usageData.timeline.length > 0 && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900">
                    Laboratory Usage & Active Users Trend (
                    {usageInterval.toUpperCase()})
                  </h3>
                  <p className="text-xs text-slate-500">
                    Comparing cumulative hours logged and unique student count
                    across {usageData.timeline.length} {usageInterval}{" "}
                    intervals.
                  </p>
                </div>

                {/* Chart Mode Toggle */}
                <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl text-xs font-semibold self-start sm:self-auto">
                  <button
                    onClick={() => setChartView("both")}
                    className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                      chartView === "both"
                        ? "bg-white text-blue-700 shadow-2xs font-bold"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Dual View (Hours & Users)
                  </button>
                  <button
                    onClick={() => setChartView("hours")}
                    className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                      chartView === "hours"
                        ? "bg-white text-blue-700 shadow-2xs font-bold"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Usage Time Only
                  </button>
                  <button
                    onClick={() => setChartView("users")}
                    className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                      chartView === "users"
                        ? "bg-white text-blue-700 shadow-2xs font-bold"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Active Users Only
                  </button>
                </div>
              </div>

              {/* Recharts Container */}
              <div className="h-72 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  {chartView === "users" ? (
                    <AreaChart data={usageData.timeline}>
                      <defs>
                        <linearGradient
                          id="userGrad"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#2563eb"
                            stopOpacity={0.3}
                          />
                          <stop
                            offset="95%"
                            stopColor="#2563eb"
                            stopOpacity={0.0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#f1f5f9"
                      />
                      <XAxis
                        dataKey="periodLabel"
                        stroke="#94a3b8"
                        fontSize={11}
                        tickLine={false}
                      />
                      <YAxis
                        stroke="#94a3b8"
                        fontSize={11}
                        tickLine={false}
                        allowDecimals={false}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#ffffff",
                          borderRadius: "12px",
                          border: "1px solid #e2e8f0",
                          fontSize: "12px",
                          boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                        }}
                        formatter={(value: any, name: any) => [
                          `${value} Students`,
                          "Active Users",
                        ]}
                      />
                      <Area
                        type="monotone"
                        dataKey="userCount"
                        stroke="#2563eb"
                        strokeWidth={2.5}
                        fill="url(#userGrad)"
                        name="Active Users"
                      />
                    </AreaChart>
                  ) : (
                    <BarChart data={usageData.timeline}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#f1f5f9"
                      />
                      <XAxis
                        dataKey="periodLabel"
                        stroke="#94a3b8"
                        fontSize={11}
                        tickLine={false}
                      />
                      <YAxis
                        yAxisId="left"
                        stroke="#10b981"
                        fontSize={11}
                        tickLine={false}
                        name="Hours"
                      />
                      {chartView === "both" && (
                        <YAxis
                          yAxisId="right"
                          orientation="right"
                          stroke="#6366f1"
                          fontSize={11}
                          tickLine={false}
                          allowDecimals={false}
                          name="Users"
                        />
                      )}
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#ffffff",
                          borderRadius: "12px",
                          border: "1px solid #e2e8f0",
                          fontSize: "12px",
                          boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                        }}
                        formatter={(val: any, name: any) => {
                          if (
                            name === "totalHours" ||
                            name === "Total Usage Time"
                          )
                            return [`${val} Hours`, "Total Usage Time"];
                          if (name === "userCount" || name === "Unique Users")
                            return [`${val} Students`, "Unique Users"];
                          return [val, name];
                        }}
                      />
                      <Legend
                        wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }}
                      />
                      <Bar
                        yAxisId="left"
                        dataKey="totalHours"
                        fill="#10b981"
                        radius={[4, 4, 0, 0]}
                        name="Total Usage Time (Hours)"
                      />
                      {chartView === "both" && (
                        <Bar
                          yAxisId="right"
                          dataKey="userCount"
                          fill="#6366f1"
                          radius={[4, 4, 0, 0]}
                          name="Unique Users (Students)"
                        />
                      )}
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Detailed Usage Table & Student Leaderboard Split Grid */}
          {usageData && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Detailed Periodic Table (2 Columns) */}
              <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Periodic Usage Breakdown ({usageInterval})
                    </h3>
                    <p className="text-xs text-slate-500">
                      Chronological ledger of users and usage duration
                    </p>
                  </div>
                  <span className="text-xs font-mono text-slate-500">
                    {usageData.timeline.length} periods
                  </span>
                </div>

                <div className="overflow-x-auto max-h-96 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold sticky top-0 uppercase">
                      <tr>
                        <th className="py-3 px-4">Period</th>
                        <th className="py-3 px-4 text-center">Active Users</th>
                        <th className="py-3 px-4 text-right">Usage Time</th>
                        <th className="py-3 px-4 text-center">Sessions</th>
                        <th className="py-3 px-4 text-right">Avg / Session</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {usageData.timeline.length === 0 ? (
                        <tr>
                          <td
                            colSpan={5}
                            className="py-8 text-center text-slate-400"
                          >
                            No usage recorded in this date range.
                          </td>
                        </tr>
                      ) : (
                        usageData.timeline.map((item, idx) => (
                          <tr
                            key={idx}
                            className="hover:bg-slate-50/80 transition-colors"
                          >
                            <td className="py-3 px-4 font-semibold text-slate-900 font-mono">
                              {item.periodLabel}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className="inline-flex items-center gap-1 font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded font-mono">
                                👥 {item.userCount}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600 tabular-nums">
                              {item.totalHours} hrs{" "}
                              <span className="text-[10px] text-slate-400 font-normal">
                                ({item.totalMinutes}m)
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center font-mono">
                              {item.sessionCount}
                            </td>
                            <td className="py-3 px-4 text-right font-mono text-slate-600 tabular-nums">
                              {item.sessionCount > 0
                                ? Math.round(
                                    item.totalMinutes / item.sessionCount,
                                  )
                                : 0}{" "}
                              min
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Student Leaderboard: Top Active Users (1 Column) */}
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden flex flex-col">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Top Active Students
                    </h3>
                    <p className="text-xs text-slate-500">
                      Most hours logged in range
                    </p>
                  </div>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Leaderboard
                  </span>
                </div>

                <div className="p-3 divide-y divide-slate-100 overflow-y-auto max-h-96 flex-1">
                  {usageData.topUsers.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400">
                      No student sessions in this period.
                    </div>
                  ) : (
                    usageData.topUsers.map((u, i) => (
                      <div
                        key={u.userId}
                        className="py-2.5 px-2 flex items-center justify-between gap-3 hover:bg-slate-50/80 rounded-xl transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-extrabold shrink-0 ${
                              i === 0
                                ? "bg-amber-100 text-amber-800 border border-amber-300"
                                : i === 1
                                  ? "bg-slate-200 text-slate-700 border border-slate-300"
                                  : i === 2
                                    ? "bg-amber-50 text-amber-900 border border-amber-200"
                                    : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {i + 1}
                          </span>
                          <div className="min-w-0 truncate">
                            <span className="text-xs font-bold text-slate-900 block truncate">
                              {u.userName}
                            </span>
                            <span className="text-[10px] text-slate-400 block truncate font-mono">
                              {u.userEmail}
                            </span>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-xs font-extrabold font-mono text-emerald-700 block tabular-nums">
                            {u.totalHours} hrs
                          </span>
                          <span className="text-[10px] text-slate-400 block font-mono">
                            {u.sessionCount}{" "}
                            {u.sessionCount === 1 ? "session" : "sessions"}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================================== */}
      {/* TAB 2: ANALYTICS & REAL-TIME KPIS */}
      {/* ============================================================================== */}
      {activeTab === "kpi" && (
        <div className="space-y-6">
          {/* Detailed Administrative Metrics Grid (Moved & Expanded from student view) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Full Laboratory Telemetry & Operational Stats
              </h3>
              <span className="text-[11px] font-mono text-slate-500">
                Last updated:{" "}
                {roomData.lastUpdated
                  ? new Date(roomData.lastUpdated).toLocaleTimeString()
                  : "Live"}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-3">
              {/* Total Desks */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Total Workstations
                </span>
                <span className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900 tabular-nums my-0.5 block">
                  {roomData.totalSeats}
                </span>
                <span className="text-[11px] text-slate-400 block">
                  4 Team Pod Clusters (A, B, C, D)
                </span>
              </div>

              {/* Available Desks */}
              <div className="bg-white p-4 rounded-xl border border-emerald-200 bg-emerald-50/20 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
                    Available Desks
                  </span>
                  <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                    {Math.round(
                      (roomData.availableSeats / roomData.totalSeats) * 100,
                    )}
                    %
                  </span>
                </div>
                <span className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-600 tabular-nums my-0.5 block">
                  {roomData.availableSeats}
                </span>
                <span className="text-[11px] text-emerald-700 block">
                  Ready for student check-in
                </span>
              </div>

              {/* Reserved Desks */}
              <div className="bg-white p-4 rounded-xl border border-indigo-200 bg-indigo-50/20 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider">
                    Reserved Desks
                  </span>
                  <span className="text-[10px] font-mono font-bold text-indigo-700 bg-indigo-100 px-1.5 py-0.5 rounded">
                    {Math.round((reservedCount / roomData.totalSeats) * 100)}%
                  </span>
                </div>
                <span className="text-2xl sm:text-3xl font-extrabold font-mono text-indigo-600 tabular-nums my-0.5 block">
                  {reservedCount}
                </span>
                <span className="text-[11px] text-indigo-700 block">
                  Held pending QR activation
                </span>
              </div>

              {/* Active Occupied */}
              <div className="bg-white p-4 rounded-xl border border-rose-200 bg-rose-50/20 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider">
                    Active Occupied
                  </span>
                  <span className="text-[10px] font-mono font-bold text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded">
                    {Math.round(
                      (roomData.occupiedSeats / roomData.totalSeats) * 100,
                    )}
                    %
                  </span>
                </div>
                <span className="text-2xl sm:text-3xl font-extrabold font-mono text-rose-600 tabular-nums my-0.5 block">
                  {roomData.occupiedSeats}
                </span>
                <span className="text-[11px] text-rose-700 block">
                  Active student sessions
                </span>
              </div>

              {/* Expiring Soon */}
              <div className="bg-white p-4 rounded-xl border border-amber-200 bg-amber-50/20 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">
                    Expiring Soon
                  </span>
                  <span className="text-[10px] font-mono font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                    &lt; 10m
                  </span>
                </div>
                <span className="text-2xl sm:text-3xl font-extrabold font-mono text-amber-600 tabular-nums my-0.5 block">
                  {expiringSoonCount}
                </span>
                <span className="text-[11px] text-amber-700 block">
                  Automated warning triggered
                </span>
              </div>

              {/* Occupancy Rate */}
              <div className="bg-white p-4 rounded-xl border border-blue-200 bg-blue-50/20 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">
                    Occupancy Rate
                  </span>
                  <span className="text-[10px] font-mono font-bold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded">
                    Capacity
                  </span>
                </div>
                <span className="text-2xl sm:text-3xl font-extrabold font-mono text-blue-700 tabular-nums my-0.5 block">
                  {roomData.occupancyPercentage}%
                </span>
                <span className="text-[11px] text-slate-500 block">
                  Active sessions + reservations
                </span>
              </div>

              {/* Server Sessions */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Active Sessions
                </span>
                <span className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900 tabular-nums my-0.5 block">
                  {activeSessions.length}
                </span>
                <span className="text-[11px] text-slate-400 block">
                  Server-authenticated tokens
                </span>
              </div>

              {/* Maintenance */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Maintenance
                </span>
                <span className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-700 tabular-nums my-0.5 block">
                  {maintenanceCount}
                </span>
                <span className="text-[11px] text-slate-400 block">
                  Desks taken out of service
                </span>
              </div>
            </div>
          </div>

          {/* Detailed Capacity Distribution & System Telemetry Bar */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Laboratory Capacity Distribution
                </h3>
                <p className="text-xs text-slate-500">
                  Breakdown of all 24 workstations in SE Innovation Lab 101
                </p>
              </div>
              <div className="text-xs font-mono text-slate-500">
                Total Capacity:{" "}
                <span className="font-bold text-slate-800">
                  {roomData.totalSeats} Workstations
                </span>
              </div>
            </div>

            {/* Stacked Capacity Progress Bar */}
            <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
              <div
                style={{
                  width: `${(roomData.availableSeats / roomData.totalSeats) * 100}%`,
                }}
                className="bg-emerald-500 transition-all duration-500"
                title={`Available: ${roomData.availableSeats} desks`}
              />
              <div
                style={{
                  width: `${(reservedCount / roomData.totalSeats) * 100}%`,
                }}
                className="bg-indigo-500 transition-all duration-500"
                title={`Reserved: ${reservedCount} desks`}
              />
              <div
                style={{
                  width: `${(roomData.occupiedSeats / roomData.totalSeats) * 100}%`,
                }}
                className="bg-rose-500 transition-all duration-500"
                title={`Occupied: ${roomData.occupiedSeats} desks`}
              />
              <div
                style={{
                  width: `${(maintenanceCount / roomData.totalSeats) * 100}%`,
                }}
                className="bg-slate-400 transition-all duration-500"
                title={`Maintenance: ${maintenanceCount} desks`}
              />
            </div>

            {/* Capacity Legend & Counts */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 shrink-0" />
                <span className="text-slate-600">
                  Available:{" "}
                  <strong className="text-slate-900">
                    {roomData.availableSeats}
                  </strong>{" "}
                  (
                  {Math.round(
                    (roomData.availableSeats / roomData.totalSeats) * 100,
                  )}
                  %)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-sm bg-indigo-500 shrink-0" />
                <span className="text-slate-600">
                  Reserved:{" "}
                  <strong className="text-slate-900">{reservedCount}</strong> (
                  {Math.round((reservedCount / roomData.totalSeats) * 100)}%)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-sm bg-rose-500 shrink-0" />
                <span className="text-slate-600">
                  Occupied:{" "}
                  <strong className="text-slate-900">
                    {roomData.occupiedSeats}
                  </strong>{" "}
                  (
                  {Math.round(
                    (roomData.occupiedSeats / roomData.totalSeats) * 100,
                  )}
                  %)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-sm bg-slate-400 shrink-0" />
                <span className="text-slate-600">
                  Maintenance:{" "}
                  <strong className="text-slate-900">{maintenanceCount}</strong>{" "}
                  ({Math.round((maintenanceCount / roomData.totalSeats) * 100)}
                  %)
                </span>
              </div>
            </div>

            {/* Operational Policies Notice */}
            <div className="bg-slate-50 rounded-lg p-3 text-xs text-slate-600 flex flex-wrap items-center justify-between gap-2 border border-slate-200/60 font-mono text-[11px]">
              <span>Max Session: 120 mins</span>
              <span>•</span>
              <span>Expiring Warning: 10 mins</span>
              <span>•</span>
              <span>Reservation Hold: 15 mins</span>
              <span>•</span>
              <span>MySQL 8.x Host Port 3307</span>
            </div>
          </div>

          {/* Recharts Analytics Section */}
          {analytics && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Hourly Occupancy Trend Chart */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Today's Peak Occupancy Profile
                    </h3>
                    <p className="text-xs text-slate-500">
                      Hourly workstation check-in volume
                    </p>
                  </div>
                  <span className="text-xs font-mono text-slate-400">
                    Peak: 14:00 (91.7%)
                  </span>
                </div>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={analytics.hourlyOccupancy}>
                      <defs>
                        <linearGradient
                          id="occupancyGradient"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#2563eb"
                            stopOpacity={0.3}
                          />
                          <stop
                            offset="95%"
                            stopColor="#2563eb"
                            stopOpacity={0.0}
                          />
                        </linearGradient>
                      </defs>
                      <XAxis
                        dataKey="hour"
                        stroke="#94a3b8"
                        fontSize={11}
                        tickLine={false}
                      />
                      <YAxis
                        stroke="#94a3b8"
                        fontSize={11}
                        tickLine={false}
                        domain={[0, 24]}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#ffffff",
                          borderRadius: "8px",
                          border: "1px solid #e2e8f0",
                          fontSize: "12px",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="occupancyCount"
                        stroke="#2563eb"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#occupancyGradient)"
                        name="Seats In Use"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Pod Utilization Bar Chart */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Scrum Pod Utilization
                    </h3>
                    <p className="text-xs text-slate-500">
                      Occupancy distribution across 4 engineering clusters
                    </p>
                  </div>
                  <span className="text-xs font-mono text-slate-400">
                    6 Seats / Pod
                  </span>
                </div>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.podUtilization}>
                      <XAxis
                        dataKey="pod"
                        stroke="#94a3b8"
                        fontSize={11}
                        tickLine={false}
                      />
                      <YAxis
                        stroke="#94a3b8"
                        fontSize={11}
                        tickLine={false}
                        domain={[0, 6]}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#ffffff",
                          borderRadius: "8px",
                          border: "1px solid #e2e8f0",
                          fontSize: "12px",
                        }}
                      />
                      <Bar
                        dataKey="occupied"
                        fill="#3b82f6"
                        radius={[4, 4, 0, 0]}
                        name="Occupied Workstations"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================================== */}
      {/* TAB 3: LIVE SESSIONS MONITOR */}
      {/* ============================================================================== */}
      {activeTab === "sessions" && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">
              Active Lab Sessions (Authoritative Server State)
            </h3>
            <span className="text-xs text-slate-500">
              {activeSessions.length} students currently checked in
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase">
                <tr>
                  <th className="py-3 px-4">Desk</th>
                  <th className="py-3 px-4">Pod Cluster</th>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Checked In</th>
                  <th className="py-3 px-4">Expires</th>
                  <th className="py-3 px-4">Remaining</th>
                  <th className="py-3 px-4 text-right">
                    Administrative Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {activeSessions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No active sessions in the laboratory at this moment.
                    </td>
                  </tr>
                ) : (
                  activeSessions.map((seat) => {
                    const session = seat.currentSession!;
                    const isExpiring = session.minutesRemaining <= 10;
                    return (
                      <tr
                        key={seat.id}
                        className="hover:bg-slate-50/80 transition-colors"
                      >
                        <td className="py-3 px-4 font-bold text-slate-900">
                          {seat.seatCode}
                        </td>
                        <td className="py-3 px-4">{seat.podLabel}</td>
                        <td className="py-3 px-4 font-medium">
                          {session.userName || "Anonymous Student"}
                        </td>
                        <td className="py-3 px-4 font-mono tabular-nums">
                          {new Date(session.checkedInAt).toLocaleTimeString()}
                        </td>
                        <td className="py-3 px-4 font-mono tabular-nums">
                          {new Date(session.expiresAt).toLocaleTimeString()}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold tabular-nums">
                          <span
                            className={
                              isExpiring ? "text-amber-600" : "text-slate-800"
                            }
                          >
                            {session.minutesRemaining} min{" "}
                            {isExpiring && "(Warning Sent)"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => {
                              setTerminatingSessionId(session.sessionId);
                              onTerminateSession(
                                session.sessionId,
                                terminateReason,
                              );
                            }}
                            className="px-2.5 py-1 text-[11px] font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded transition-colors cursor-pointer"
                          >
                            Force Release
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================================== */}
      {/* TAB 4: WORKSTATION MANAGEMENT */}
      {/* ============================================================================== */}
      {activeTab === "seats" && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">
              Workstation Inventory & Maintenance Controls
            </h3>
            <span className="text-xs text-slate-500">
              24 Registered Workstations
            </span>
          </div>

          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {roomData.seats.map((seat) => (
              <div
                key={seat.id}
                className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-900">
                      {seat.seatCode}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        seat.status === "AVAILABLE"
                          ? "bg-emerald-100 text-emerald-800"
                          : seat.status === "OCCUPIED"
                            ? "bg-rose-100 text-rose-800"
                            : seat.status === "EXPIRING_SOON"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-slate-200 text-slate-700"
                      }`}
                    >
                      {seat.status}
                    </span>
                  </div>
                  <span className="text-xs text-slate-500 mt-1 block">
                    {seat.podLabel}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 mt-1 block">
                    X: {seat.xPosition}, Y: {seat.yPosition}
                  </span>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-200/80 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-mono truncate max-w-[100px]">
                    {seat.qrToken}
                  </span>
                  <button
                    onClick={() => onToggleSeatMaintenance(seat)}
                    className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 cursor-pointer"
                  >
                    {seat.status === "MAINTENANCE"
                      ? "Restore Active"
                      : "Set Maintenance"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================================== */}
      {/* TAB 5: QR CODE GENERATOR */}
      {/* ============================================================================== */}
      {activeTab === "qrcodes" && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Printable Desk QR Code Signage
              </h3>
              <p className="text-xs text-slate-500">
                Generate high-resolution printable QR stickers for physical lab
                desks. Contains opaque seat identifier URL.
              </p>
            </div>
            <button
              onClick={() => window.print()}
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer self-start sm:self-auto shadow-xs"
            >
              Print Labels / Save PDF
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {qrList.map(({ seat, qrDataUrl }) => (
              <div
                key={seat.id}
                className="p-3 bg-white border-2 border-slate-300 rounded-xl text-center flex flex-col items-center shadow-xs"
              >
                <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">
                  SE Innovation Lab
                </span>
                <span className="text-sm font-extrabold text-slate-900 my-0.5">
                  {seat.seatCode}
                </span>
                <img
                  src={qrDataUrl}
                  alt={`QR for ${seat.seatCode}`}
                  className="w-24 h-24 my-1 border border-slate-200 p-1"
                />
                <span className="text-[9px] font-mono text-slate-500">
                  {seat.qrToken}
                </span>
                <span className="text-[8px] text-slate-400 mt-1">
                  Scan with camera to check in
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
