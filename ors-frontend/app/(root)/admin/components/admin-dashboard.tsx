'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import QRCode from 'qrcode';
import { useLogoutMutation } from '@/hooks/use-auth-query';
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
} from 'recharts';
import {
  Seat,
  SeatStatus,
  OccupancyMapResponse,
  UsageDashboardData,
  UsageInterval,
  User,
  OccupancySession,
  UserRole,
} from '@/types';
import {
  useAdminAnalyticsQuery,
  useUsageMetricsQuery,
  useAdminUsersQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useCreateSeatMutation,
  useUpdateSeatMutation,
  useDeleteSeatMutation,
  useAdminSessionsQuery,
  useDeleteSessionMutation,
} from '@/hooks/use-admin-query';
import { useApp } from '@/hooks/use-app-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  BarChart3,
  Monitor,
  Printer,
  RefreshCw,
  Clock,
  Users,
  AlertTriangle,
  Wrench,
  CheckCircle2,
  XCircle,
  Plus,
  Minus,
  Ban,
  RotateCcw,
  Trash2,
  Edit,
  Shield,
  KeyRound,
  Search,
  ChevronRight,
  ExternalLink,
  ChevronDown,
  LayoutGrid,
  Calendar,
  Layers,
  ArrowRight,
  Check,
  LogOut,
  HelpCircle,
  TrendingUp,
  Activity,
  History,
  UserCog,
  QrCode,
  Download,
} from 'lucide-react';
import { ROUTES } from '@/config/routes';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { TablePagination } from '@/components/ui/table-pagination';
import { FloorPlan2D } from '@/app/(root)/components/floor-plan-2d';
import {
  isLabOpenAt,
  getLabOperatingStatus,
  formatLabHour,
  formatLabHoursRange,
  DEFAULT_LAB_CONFIG,
  LAB_HOURS_DISPLAY,
  LAB_TIMEZONE,
  LAB_OPENS_HOUR,
  LAB_CLOSES_HOUR,
} from '@/utils/lab-hours';

interface AdminDashboardProps {
  roomData: OccupancyMapResponse;
  onRefresh: () => void;
  onToggleSeatMaintenance: (seat: Seat) => void;
  onTerminateSession: (sessionId: number, reason: string) => Promise<void>;
}

type AdminSection = 'usage' | 'kpis' | 'workstations' | 'users' | 'sessions';

export function AdminDashboard({
  roomData,
  onRefresh,
  onToggleSeatMaintenance,
  onTerminateSession,
}: AdminDashboardProps) {
  const router = useRouter();
  const {
    currentUser,
    setCurrentUser,
    showToast,
    openUserDetailModal,
    labConfig,
    updateLabConfig,
    toggleWorkstationsAllowed,
  } = useApp();
  const logoutMutation = useLogoutMutation();

  // Active section in left sidebar
  const [activeSection, setActiveSection] = useState<AdminSection>('usage');

  // Usage reports state
  const [usageInterval, setUsageInterval] = useState<UsageInterval>('weekly');
  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  // Time period preset handler
  const handleSelectPreset = (preset: '7d' | '14d' | '30d' | '90d' | 'year' | 'all') => {
    const now = new Date();
    const end = now.toISOString().split('T')[0];
    let start = '';
    const d = new Date(now);

    if (preset === '7d') {
      d.setDate(d.getDate() - 7);
      start = d.toISOString().split('T')[0];
    } else if (preset === '14d') {
      d.setDate(d.getDate() - 14);
      start = d.toISOString().split('T')[0];
    } else if (preset === '30d') {
      d.setDate(d.getDate() - 30);
      start = d.toISOString().split('T')[0];
    } else if (preset === '90d') {
      d.setDate(d.getDate() - 90);
      start = d.toISOString().split('T')[0];
    } else if (preset === 'year') {
      d.setFullYear(d.getFullYear() - 1);
      start = d.toISOString().split('T')[0];
    } else if (preset === 'all') {
      start = '2020-01-01';
    }

    setStartDate(start);
    setEndDate(end);
  };

  // React Query calls
  const { data: usageData, refetch: refetchUsage, isLoading: isUsageLoading } = useUsageMetricsQuery({
    interval: usageInterval,
    startDate,
    endDate,
  });
  const { data: usersList = [], refetch: refetchUsers, isLoading: isUsersLoading } = useAdminUsersQuery();
  const { data: sessionsList = [], refetch: refetchSessions, isLoading: isSessionsLoading } = useAdminSessionsQuery();

  // Mutations
  const createUserMutation = useCreateUserMutation();
  const updateUserMutation = useUpdateUserMutation();
  const deleteUserMutation = useDeleteUserMutation();
  const createSeatMutation = useCreateSeatMutation();
  const updateSeatMutation = useUpdateSeatMutation();
  const deleteSeatMutation = useDeleteSeatMutation();
  const deleteSessionMutation = useDeleteSessionMutation();

  // --------------------------------------------------------------------------
  // USER MANAGEMENT STATE
  // --------------------------------------------------------------------------
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<'ALL' | 'STUDENT' | 'ADMINISTRATOR'>('ALL');
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // User form states
  const [userFormStudentId, setUserFormStudentId] = useState('');
  const [userFormFullName, setUserFormFullName] = useState('');
  const [userFormEmail, setUserFormEmail] = useState('');
  const [userFormPassword, setUserFormPassword] = useState('');
  const [userFormRole, setUserFormRole] = useState<UserRole>('STUDENT');

  // --------------------------------------------------------------------------
  // WORKSPACE & SEAT MANAGEMENT STATE
  // --------------------------------------------------------------------------
  const [workstationViewMode, setWorkstationViewMode] = useState<'table' | 'map'>('table');
  const [adminSelectedSeat, setAdminSelectedSeat] = useState<Seat | null>(null);
  const [seatSearch, setSeatSearch] = useState('');
  const [seatPodFilter, setSeatPodFilter] = useState<string>('ALL');
  const [seatStatusFilter, setSeatStatusFilter] = useState<string>('ALL');
  const [isAddSeatOpen, setIsAddSeatOpen] = useState(false);
  const [isEditSeatOpen, setIsEditSeatOpen] = useState(false);
  const [selectedSeat, setSelectedSeat] = useState<Seat | null>(null);

  // Time control & lab operating hours state (09:00 AM - 05:00 PM)
  const [currentBangkokTime, setCurrentBangkokTime] = useState<Date>(() => new Date());
  const [isTimeControlModalOpen, setIsTimeControlModalOpen] = useState(false);
  const [tempOpenHour, setTempOpenHour] = useState<number>(labConfig.openHour);
  const [tempCloseHour, setTempCloseHour] = useState<number>(labConfig.closeHour);

  useEffect(() => {
    setTempOpenHour(labConfig.openHour);
    setTempCloseHour(labConfig.closeHour);
  }, [labConfig.openHour, labConfig.closeHour]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentBangkokTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const labStatus = useMemo(() => {
    return getLabOperatingStatus(currentBangkokTime, labConfig);
  }, [currentBangkokTime, labConfig]);

  const handleSetWorkstationsAllowed = (allowed: boolean) => {
    if (labConfig.workstationsEnabled === allowed) return;
    updateLabConfig({ workstationsEnabled: allowed });
    if (allowed) {
      showToast('Workstations are now allowed for student reservations.', 'success');
    } else {
      showToast('Workstations are now disabled. Student reservations are locked.', 'info');
    }
  };

  const handleToggleWorkstationsAllowed = () => {
    handleSetWorkstationsAllowed(!labConfig.workstationsEnabled);
  };

  const handleUpdateLabHours = () => {
    if (tempOpenHour >= tempCloseHour) {
      showToast('Close time must be after open time.', 'error');
      return;
    }
    updateLabConfig({
      openHour: tempOpenHour,
      closeHour: tempCloseHour,
    });
    showToast(`Workstation hours updated to ${formatLabHoursRange(tempOpenHour, tempCloseHour)}.`, 'success');
  };

  const handleAdjustOpenHour = (delta: number) => {
    const newOpen = labConfig.openHour + delta;
    if (newOpen < 6 || newOpen >= labConfig.closeHour) return;
    updateLabConfig({ openHour: newOpen });
    showToast(`Opening time updated to ${formatLabHour(newOpen)}.`, 'info');
  };

  const handleAdjustCloseHour = (delta: number) => {
    const newClose = labConfig.closeHour + delta;
    if (newClose <= labConfig.openHour || newClose > 23) return;
    updateLabConfig({ closeHour: newClose });
    showToast(`Closing time updated to ${formatLabHour(newClose)}.`, 'info');
  };

  const handleResetLabHours = () => {
    updateLabConfig({
      openHour: DEFAULT_LAB_CONFIG.openHour,
      closeHour: DEFAULT_LAB_CONFIG.closeHour,
    });
    showToast('Operating schedule reset to 09:00 AM – 05:00 PM.', 'info');
  };

  // Custom workspaces state (registered workspaces)
  const [customWorkspaces, setCustomWorkspaces] = useState<
    { id: string; name: string; type: 'INDIVIDUAL' | 'GROUP'; groupTableId?: number; seatCount?: number }[]
  >(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('ors_admin_custom_workspaces');
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return [];
  });

  // Workspace creation modal
  const [isAddWorkspaceOpen, setIsAddWorkspaceOpen] = useState(false);
  const [workspaceFormName, setWorkspaceFormName] = useState('');
  const [workspaceFormType, setWorkspaceFormType] = useState<'INDIVIDUAL' | 'GROUP'>('INDIVIDUAL');
  const [workspaceFormGroupTableId, setWorkspaceFormGroupTableId] = useState<number | undefined>(undefined);

  // Seat form states
  const [seatFormCode, setSeatFormCode] = useState('');
  const [seatFormPod, setSeatFormPod] = useState('Station A');
  const [seatFormType, setSeatFormType] = useState<'INDIVIDUAL' | 'GROUP'>('INDIVIDUAL');
  const [seatFormGroupTableId, setSeatFormGroupTableId] = useState<number | undefined>(undefined);
  const [seatFormStatus, setSeatFormStatus] = useState<string>('AVAILABLE');

  // --------------------------------------------------------------------------
  // SESSIONS MONITORING STATE
  // --------------------------------------------------------------------------
  const [sessionUserFilter, setSessionUserFilter] = useState<string>('ALL');
  const [sessionStatusFilter, setSessionStatusFilter] = useState<string>('ALL');
  const [sessionSeatSearch, setSessionSeatSearch] = useState('');

  // Terminate session state
  const [terminatingSessionId, setTerminatingSessionId] = useState<number | null>(null);
  const [terminateReason, setTerminateReason] = useState<string>('Exceeded time limit / unattended workstation');

  // QR Modal
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [generatedQrs, setGeneratedQrs] = useState<{ seat: Seat; dataUrl: string }[]>([]);
  const [generatingQrs, setGeneratingQrs] = useState(false);

  // --------------------------------------------------------------------------
  // PAGINATION STATES (DEFAULT 25, ADJUSTABLE TO 10, 25, 50, 100, 150)
  // --------------------------------------------------------------------------
  const [seatPage, setSeatPage] = useState(1);
  const [seatPageSize, setSeatPageSize] = useState(25);

  const [userPage, setUserPage] = useState(1);
  const [userPageSize, setUserPageSize] = useState(25);

  const [sessionPage, setSessionPage] = useState(1);
  const [sessionPageSize, setSessionPageSize] = useState(25);

  // --------------------------------------------------------------------------
  // DELETE CONFIRMATION POP UP CARD STATE
  // --------------------------------------------------------------------------
  const [deleteConfirmState, setDeleteConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    itemLabel?: string;
    onConfirm: () => Promise<void>;
  }>({
    isOpen: false,
    title: '',
    description: '',
    onConfirm: async () => {},
  });
  const [isDeleting, setIsDeleting] = useState(false);

  // --------------------------------------------------------------------------
  // REFRESH ALL DATA
  // --------------------------------------------------------------------------
  const handleRefreshAll = async () => {
    onRefresh();
    await Promise.all([refetchUsage(), refetchUsers(), refetchSessions()]);
    showToast('Dashboard data refreshed.', 'info');
  };

  // Open QR modal
  const openQrModal = async () => {
    setIsQrModalOpen(true);
    setGeneratingQrs(true);
    try {
      const list = await Promise.all(
        roomData.seats.map(async (seat) => {
          const dataUrl = await QRCode.toDataURL(seat.qrToken, {
            width: 300,
            margin: 2,
            color: { dark: '#1e293b', light: '#ffffff' },
          });
          return { seat, dataUrl };
        }),
      );
      setGeneratedQrs(list);
    } catch {
      showToast('Failed to generate QR codes', 'error');
    } finally {
      setGeneratingQrs(false);
    }
  };

  // Download QR code as PNG image
  const handleDownloadQr = (seat: Seat, dataUrl: string) => {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `QR-${seat.seatCode}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Downloaded QR code for ${seat.seatCode}`, 'success');
  };

  // Download QR code directly for a single seat
  const handleDownloadSeatQr = async (seat: Seat) => {
    try {
      const dataUrl = await QRCode.toDataURL(seat.qrToken, {
        width: 350,
        margin: 2,
        color: { dark: '#1e293b', light: '#ffffff' },
      });
      handleDownloadQr(seat, dataUrl);
    } catch {
      showToast(`Failed to generate QR code for ${seat.seatCode}`, 'error');
    }
  };

  // --------------------------------------------------------------------------
  // USER CRUD HANDLERS
  // --------------------------------------------------------------------------
  const handleOpenAddUser = () => {
    setUserFormStudentId('');
    setUserFormFullName('');
    setUserFormEmail('');
    setUserFormPassword('StudentPass123!');
    setUserFormRole('STUDENT');
    setIsAddUserOpen(true);
  };

  const handleOpenEditUser = (u: User) => {
    setSelectedUser(u);
    setUserFormFullName(u.fullName || '');
    setUserFormEmail(u.email || '');
    setUserFormRole(u.role);
    setUserFormPassword('');
    setIsEditUserOpen(true);
  };

  const handleCreateUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userFormStudentId.trim() || !userFormFullName.trim()) {
      showToast('Student ID and Full Name are required.', 'error');
      return;
    }
    try {
      await createUserMutation.mutateAsync({
        studentId: userFormStudentId.trim(),
        fullName: userFormFullName.trim(),
        email: userFormEmail.trim(),
        password: userFormPassword || 'StudentPass123!',
        role: userFormRole,
      });
      showToast(`User ${userFormStudentId} created successfully!`, 'success');
      setIsAddUserOpen(false);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to create user', 'error');
    }
  };

  const handleUpdateUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    try {
      await updateUserMutation.mutateAsync({
        id: selectedUser.id,
        payload: {
          fullName: userFormFullName.trim(),
          email: userFormEmail.trim(),
          role: userFormRole,
          password: userFormPassword.trim() ? userFormPassword.trim() : undefined,
        },
      });
      showToast(`User ${selectedUser.username || selectedUser.id} updated!`, 'success');
      setIsEditUserOpen(false);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to update user', 'error');
    }
  };

  const handleDeleteUser = (u: User) => {
    setDeleteConfirmState({
      isOpen: true,
      title: 'Delete User Account',
      description: `Are you sure you want to delete user "${u.fullName || u.username}"? This will permanently remove their account, active sessions, and reservation records. This action cannot be undone.`,
      itemLabel: u.fullName ? `${u.fullName} (@${u.username})` : `@${u.username}`,
      onConfirm: async () => {
        await deleteUserMutation.mutateAsync(u.id);
        showToast(`User ${u.fullName || u.username} deleted.`, 'info');
        onRefresh();
      },
    });
  };

  // --------------------------------------------------------------------------
  // WORKSPACES COMPUTED LIST & HELPERS
  // --------------------------------------------------------------------------
  const availableWorkspaces = useMemo(() => {
    const map = new Map<string, { id: string; name: string; type: 'INDIVIDUAL' | 'GROUP'; groupTableId?: number; seatCount?: number }>();

    // 1. Standard default room stations
    const defaults = [
      { id: 'Station A', name: 'Station A', type: 'INDIVIDUAL' as const },
      { id: 'Station B', name: 'Station B', type: 'INDIVIDUAL' as const },
      { id: 'Station C', name: 'Station C', type: 'INDIVIDUAL' as const },
      { id: 'Station D', name: 'Station D', type: 'INDIVIDUAL' as const },
      { id: 'Station E', name: 'Station E', type: 'INDIVIDUAL' as const },
      { id: 'Group table 1', name: 'Group table 1', type: 'GROUP' as const, groupTableId: 1 },
      { id: 'Group table 2', name: 'Group table 2', type: 'GROUP' as const, groupTableId: 2 },
      { id: 'Group table 3', name: 'Group table 3', type: 'GROUP' as const, groupTableId: 3 },
      { id: 'Group table 4', name: 'Group table 4', type: 'GROUP' as const, groupTableId: 4 },
      { id: 'Group table 5', name: 'Group table 5', type: 'GROUP' as const, groupTableId: 5 },
    ];
    defaults.forEach((d) => map.set(d.name.toLowerCase(), { ...d, seatCount: 0 }));

    // 2. Discover from existing seats in roomData
    roomData.seats.forEach((s) => {
      const name = s.podLabel || 'Station';
      const key = name.toLowerCase();
      const existing = map.get(key);
      if (existing) {
        existing.seatCount = (existing.seatCount || 0) + 1;
        if (s.tableType) existing.type = s.tableType;
        if (s.groupTableId) existing.groupTableId = s.groupTableId;
      } else {
        map.set(key, {
          id: name,
          name,
          type: s.tableType || 'INDIVIDUAL',
          groupTableId: s.groupTableId || undefined,
          seatCount: 1,
        });
      }
    });

    // 3. Custom workspaces created by admin
    customWorkspaces.forEach((cw) => {
      const key = cw.name.toLowerCase();
      if (!map.has(key)) {
        map.set(key, { ...cw, seatCount: 0 });
      }
    });

    return Array.from(map.values());
  }, [roomData.seats, customWorkspaces]);

  // Helper to suggest next seat code when selecting a workspace
  const suggestNextSeatCode = (ws: { name: string; type: 'INDIVIDUAL' | 'GROUP'; groupTableId?: number }) => {
    const existingInPod = roomData.seats.filter(
      (s) =>
        s.podLabel?.toLowerCase() === ws.name.toLowerCase() ||
        (ws.type === 'GROUP' && ws.groupTableId && s.groupTableId === ws.groupTableId),
    );

    if (ws.type === 'GROUP') {
      const gId = ws.groupTableId || 1;
      let maxNum = 0;
      existingInPod.forEach((s) => {
        const m = s.seatCode.match(new RegExp(`GT${gId}-(\\d+)`, 'i')) || s.seatCode.match(/(\d+)$/);
        if (m) {
          const num = parseInt(m[1], 10);
          if (num > maxNum) maxNum = num;
        }
      });
      return `GT${gId}-${maxNum + 1}`;
    } else {
      // Individual station
      const letterMatch = ws.name.match(/station\s+([a-zA-Z])/i);
      const letter = letterMatch ? letterMatch[1].toUpperCase() : ws.name.substring(0, 1).toUpperCase();
      let maxNum = 0;
      existingInPod.forEach((s) => {
        const m = s.seatCode.match(new RegExp(`${letter}(\\d+)`, 'i')) || s.seatCode.match(/(\d+)$/);
        if (m) {
          const num = parseInt(m[1], 10);
          if (num > maxNum) maxNum = num;
        }
      });
      return `${letter}${maxNum + 1}`;
    }
  };

  // --------------------------------------------------------------------------
  // WORKSPACE CRUD HANDLERS
  // --------------------------------------------------------------------------
  const handleOpenAddWorkspace = () => {
    setWorkspaceFormName('');
    setWorkspaceFormType('INDIVIDUAL');
    setWorkspaceFormGroupTableId(undefined);
    setIsAddWorkspaceOpen(true);
  };

  const handleCreateWorkspaceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const name = workspaceFormName.trim();
    if (!name) {
      showToast('Workspace name is required.', 'error');
      return;
    }

    const newWs = {
      id: name,
      name,
      type: workspaceFormType,
      groupTableId:
        workspaceFormType === 'GROUP'
          ? workspaceFormGroupTableId ||
            availableWorkspaces.filter((w) => w.type === 'GROUP').length + 1
          : undefined,
      seatCount: 0,
    };

    setCustomWorkspaces((prev) => {
      const updated = [...prev.filter((w) => w.name.toLowerCase() !== name.toLowerCase()), newWs];
      try {
        localStorage.setItem('ors_admin_custom_workspaces', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    showToast(`Workspace "${name}" created!`, 'success');
    setIsAddWorkspaceOpen(false);

    // Automatically transition to Add Seat with this new workspace pre-selected!
    setSeatFormPod(newWs.name);
    setSeatFormType(newWs.type);
    setSeatFormGroupTableId(newWs.groupTableId);
    setSeatFormCode(suggestNextSeatCode(newWs));
    setSeatFormStatus('AVAILABLE');
    setIsAddSeatOpen(true);
  };

  // --------------------------------------------------------------------------
  // SEAT CRUD HANDLERS
  // --------------------------------------------------------------------------
  const handleOpenAddSeat = (targetWsName?: string) => {
    const ws =
      (targetWsName ? availableWorkspaces.find((w) => w.name.toLowerCase() === targetWsName.toLowerCase()) : null) ||
      availableWorkspaces[0] || {
        id: 'Station A',
        name: 'Station A',
        type: 'INDIVIDUAL' as const,
      };
    setSeatFormPod(ws.name);
    setSeatFormType(ws.type);
    setSeatFormGroupTableId(ws.groupTableId);
    setSeatFormCode(suggestNextSeatCode(ws));
    setSeatFormStatus('AVAILABLE');
    setIsAddSeatOpen(true);
  };

  const handleSelectWorkspaceInForm = (wsName: string) => {
    const ws = availableWorkspaces.find((w) => w.name.toLowerCase() === wsName.toLowerCase());
    if (!ws) return;
    setSeatFormPod(ws.name);
    setSeatFormType(ws.type);
    setSeatFormGroupTableId(ws.groupTableId);
    setSeatFormCode(suggestNextSeatCode(ws));
  };

  const handleOpenEditSeat = (s: Seat) => {
    setSelectedSeat(s);
    setSeatFormCode(s.seatCode.replace(/^SEAT-/, ''));
    setSeatFormPod(s.podLabel || 'Station A');
    setSeatFormType(s.tableType || 'INDIVIDUAL');
    setSeatFormGroupTableId(s.groupTableId);
    setSeatFormStatus(s.status || 'AVAILABLE');
    setIsEditSeatOpen(true);
  };

  const handleCreateSeatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!seatFormCode.trim()) {
      showToast('Seat code is required.', 'error');
      return;
    }
    try {
      await createSeatMutation.mutateAsync({
        seatCode: seatFormCode.trim().toUpperCase(),
        podLabel: seatFormPod.trim(),
        tableType: seatFormType,
        groupTableId: seatFormType === 'GROUP' ? seatFormGroupTableId : null,
        groupTableName: seatFormType === 'GROUP' ? seatFormPod.trim() : null,
        groupCapacity: seatFormType === 'GROUP' ? 4 : 1,
        status: seatFormStatus,
        roomId: roomData?.room?.id || 1,
      });
      showToast(`Workstation ${seatFormCode.toUpperCase()} created!`, 'success');
      setIsAddSeatOpen(false);
      onRefresh();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to create seat', 'error');
    }
  };

  const handleUpdateSeatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSeat) return;
    try {
      await updateSeatMutation.mutateAsync({
        seatId: selectedSeat.id,
        payload: {
          seatCode: seatFormCode.trim().toUpperCase(),
          podLabel: seatFormPod.trim(),
          tableType: seatFormType,
          groupTableId: seatFormType === 'GROUP' ? seatFormGroupTableId : null,
          groupTableName: seatFormType === 'GROUP' ? seatFormPod.trim() : null,
          status: seatFormStatus,
          roomId: roomData?.room?.id || 1,
        },
      });
      showToast(`Workstation updated!`, 'success');
      setIsEditSeatOpen(false);
      if (adminSelectedSeat?.id === selectedSeat.id) {
        setAdminSelectedSeat((prev) =>
          prev
            ? {
                ...prev,
                seatCode: seatFormCode.trim().toUpperCase().startsWith('SEAT-')
                  ? seatFormCode.trim().toUpperCase()
                  : `SEAT-${seatFormCode.trim().toUpperCase()}`,
                podLabel: seatFormPod.trim(),
                tableType: seatFormType,
                groupTableId: seatFormType === 'GROUP' ? seatFormGroupTableId : undefined,
                status: seatFormStatus as SeatStatus,
              }
            : null,
        );
      }
      onRefresh();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to update seat', 'error');
    }
  };

  const handleDeleteSeat = (s: Seat) => {
    setDeleteConfirmState({
      isOpen: true,
      title: 'Delete Workstation',
      description: `Are you sure you want to permanently delete workstation ${s.seatCode}? Students will no longer see or be able to reserve this desk.`,
      itemLabel: `Workstation ${s.seatCode} (${s.podLabel || 'Station'})`,
      onConfirm: async () => {
        await deleteSeatMutation.mutateAsync(s.id);
        if (adminSelectedSeat?.id === s.id) {
          setAdminSelectedSeat(null);
        }
        showToast(`Workstation ${s.seatCode} deleted.`, 'info');
        onRefresh();
      },
    });
  };

  // --------------------------------------------------------------------------
  // SESSION MODERATION HANDLERS
  // --------------------------------------------------------------------------
  const handleConfirmTerminate = async () => {
    if (!terminatingSessionId) return;
    try {
      await onTerminateSession(terminatingSessionId, terminateReason);
      setTerminatingSessionId(null);
      await refetchSessions();
      onRefresh();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to terminate session', 'error');
    }
  };

  const handleDeleteSession = (sessionId: number) => {
    setDeleteConfirmState({
      isOpen: true,
      title: 'Delete Session Record',
      description: `Are you sure you want to permanently remove session history record #${sessionId}? This action cannot be undone.`,
      itemLabel: `Session Log #${sessionId}`,
      onConfirm: async () => {
        await deleteSessionMutation.mutateAsync(sessionId);
        showToast('Session record deleted.', 'info');
        onRefresh();
      },
    });
  };

  // --------------------------------------------------------------------------
  // COMPUTED DATA FOR DISPLAY
  // --------------------------------------------------------------------------
  const filteredUsers = useMemo(() => {
    return usersList.filter((u) => {
      const matchSearch =
        !userSearch.trim() ||
        (u.username && u.username.toLowerCase().includes(userSearch.toLowerCase())) ||
        (u.fullName && u.fullName.toLowerCase().includes(userSearch.toLowerCase())) ||
        (u.email && u.email.toLowerCase().includes(userSearch.toLowerCase()));
      const matchRole =
        userRoleFilter === 'ALL' ||
        (userRoleFilter === 'ADMINISTRATOR' && (u.role === 'ADMINISTRATOR' || u.role === 'ROLE_ADMIN')) ||
        (userRoleFilter === 'STUDENT' && (u.role === 'STUDENT' || u.role === 'ROLE_USER'));
      return matchSearch && matchRole;
    });
  }, [usersList, userSearch, userRoleFilter]);

  const filteredSeats = useMemo(() => {
    return roomData.seats.filter((s) => {
      const matchSearch =
        !seatSearch.trim() ||
        s.seatCode.toLowerCase().includes(seatSearch.toLowerCase()) ||
        s.podLabel.toLowerCase().includes(seatSearch.toLowerCase());
      const matchPod = seatPodFilter === 'ALL' || s.podLabel.toLowerCase() === seatPodFilter.toLowerCase();
      const matchStatus = seatStatusFilter === 'ALL' || s.status.toLowerCase() === seatStatusFilter.toLowerCase();
      return matchSearch && matchPod && matchStatus;
    });
  }, [roomData.seats, seatSearch, seatPodFilter, seatStatusFilter]);

  const filteredSessions = useMemo(() => {
    return sessionsList.filter((s) => {
      const matchUser = sessionUserFilter === 'ALL' || String(s.userId) === sessionUserFilter;
      const matchStatus = sessionStatusFilter === 'ALL' || s.status.toUpperCase() === sessionStatusFilter.toUpperCase();
      const matchSeat = !sessionSeatSearch.trim() || s.seatCode.toLowerCase().includes(sessionSeatSearch.toLowerCase());
      return matchUser && matchStatus && matchSeat;
    });
  }, [sessionsList, sessionUserFilter, sessionStatusFilter, sessionSeatSearch]);

  // Paginated data slices
  const paginatedSeats = useMemo(() => {
    const start = (seatPage - 1) * seatPageSize;
    return filteredSeats.slice(start, start + seatPageSize);
  }, [filteredSeats, seatPage, seatPageSize]);

  const paginatedUsers = useMemo(() => {
    const start = (userPage - 1) * userPageSize;
    return filteredUsers.slice(start, start + userPageSize);
  }, [filteredUsers, userPage, userPageSize]);

  const paginatedSessions = useMemo(() => {
    const start = (sessionPage - 1) * sessionPageSize;
    return filteredSessions.slice(start, start + sessionPageSize);
  }, [filteredSessions, sessionPage, sessionPageSize]);

  // Reset page when filters change
  useEffect(() => {
    setSeatPage(1);
  }, [seatSearch, seatPodFilter, seatStatusFilter]);

  useEffect(() => {
    setUserPage(1);
  }, [userSearch, userRoleFilter]);

  useEffect(() => {
    setSessionPage(1);
  }, [sessionUserFilter, sessionStatusFilter, sessionSeatSearch]);

  const uniquePods = useMemo(() => {
    const set = new Set<string>();
    roomData.seats.forEach((s) => set.add(s.podLabel));
    return Array.from(set);
  }, [roomData.seats]);

  // Status metrics
  const availableCount = roomData.seats.filter((s) => s.status === 'AVAILABLE').length;
  const occupiedCount = roomData.seats.filter((s) => s.status === 'OCCUPIED').length;
  const maintenanceCount = roomData.seats.filter((s) => s.status === 'MAINTENANCE').length;
  const totalCount = roomData.seats.length || 54;
  const activePercent = totalCount > 0 ? Math.round((occupiedCount / (totalCount - maintenanceCount || 1)) * 100) : 0;

  // Chart data from usageMetrics or empty
  const timelineData = useMemo(() => {
    if (usageData && usageData.timeline && usageData.timeline.length > 0) {
      return usageData.timeline.map((t) => ({
        label: t.periodLabel || t.dateKey,
        hours: t.totalHours,
      }));
    }
    return [];
  }, [usageData]);

  // Top active students from usageMetrics (empty until real data comes)
  const topStudents = useMemo(() => {
    if (usageData && usageData.topUsers && usageData.topUsers.length > 0) {
      return usageData.topUsers.map((u) => ({
        studentName: u.userName,
        email: u.userEmail,
        sessionsCount: u.sessionCount,
        totalHours: u.totalHours,
      }));
    }
    return [];
  }, [usageData]);

  // Initials helper
  const getInitials = (name?: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  // Short and clean profile name (e.g. "Admin", "Alex K.")
  const getCleanShortName = (name?: string) => {
    if (!name) return 'Admin';
    const trimmed = name.trim();
    if (/^(ors\s+)?admin(istrator)?$/i.test(trimmed)) {
      return 'Admin';
    }
    const parts = trimmed.split(/\s+/);
    if (parts.length > 1) {
      return `${parts[0]} ${parts[1][0]}.`;
    }
    return trimmed.length > 10 ? `${trimmed.slice(0, 9)}…` : trimmed;
  };

  return (
    <div className="w-full min-h-screen md:h-screen md:overflow-hidden flex flex-col md:flex-row bg-white dark:bg-[#0f141c] font-sans antialiased text-slate-800 dark:text-slate-100">
      {/* -------------------------------------------------------------------- */}
      {/* 1. LEFT SIDEBAR (Matching media_1793676626285_d7600dd0.jpg)         */}
      {/* -------------------------------------------------------------------- */}
      <aside className="hidden w-64 shrink-0 bg-white dark:bg-[#161c26] border-r border-[#edf1f7] dark:border-[#232c3d] md:flex md:flex-col justify-between md:h-screen md:sticky md:top-0 select-none shadow-[1px_0_4px_rgba(0,0,0,0.01)] z-30">
        <div className="flex-1 overflow-y-auto">
          {/* Logo Brand Header */}
          <div className="h-16 px-5 border-b border-[#edf1f7] dark:border-[#232c3d] flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#4a7cf6] text-white flex items-center justify-center font-bold shadow-xs">
              <LayoutGrid className="w-4 h-4" />
            </div>
            <div className="leading-tight">
              <div className="font-bold text-sm text-slate-800 dark:text-white tracking-tight">
                SE Lab
              </div>
              <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                Occupancy
              </div>
            </div>
          </div>

          {/* Group 1: ADMIN CONSOLE */}
          <div className="px-3 pt-5 pb-2">
            <div className="px-3 pb-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-wider uppercase">
              Admin Console
            </div>

            <nav className="space-y-1">
              <button
                type="button"
                onClick={() => setActiveSection('usage')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeSection === 'usage'
                    ? 'bg-[#f0f5ff] text-[#4070d8] dark:bg-blue-950/40 dark:text-blue-300 shadow-2xs'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-[#f8fafc] dark:hover:bg-slate-900/40 hover:text-slate-800 dark:hover:text-white font-medium'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <BarChart3 className={`w-4 h-4 ${activeSection === 'usage' ? 'text-[#4a7cf6]' : 'text-slate-400'}`} />
                  <span>Usage reports</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setActiveSection('kpis')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeSection === 'kpis'
                    ? 'bg-[#f0f5ff] text-[#4070d8] dark:bg-blue-950/40 dark:text-blue-300 shadow-2xs'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-[#f8fafc] dark:hover:bg-slate-900/40 hover:text-slate-800 dark:hover:text-white font-medium'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Activity className={`w-4 h-4 ${activeSection === 'kpis' ? 'text-[#4a7cf6]' : 'text-slate-400'}`} />
                  <span>Real-time KPIs</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setActiveSection('workstations')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeSection === 'workstations'
                    ? 'bg-[#f0f5ff] text-[#4070d8] dark:bg-blue-950/40 dark:text-blue-300 shadow-2xs'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-[#f8fafc] dark:hover:bg-slate-900/40 hover:text-slate-800 dark:hover:text-white font-medium'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Monitor className={`w-4 h-4 ${activeSection === 'workstations' ? 'text-[#4a7cf6]' : 'text-slate-400'}`} />
                  <span>Workstations</span>
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${!labConfig.workstationsEnabled ? 'bg-rose-500' : labStatus.isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`}
                    title={!labConfig.workstationsEnabled ? 'Workstations Disabled' : labStatus.isOpen ? `SE Lab Open (${formatLabHoursRange(labConfig.openHour, labConfig.closeHour)})` : `SE Lab Closed (${formatLabHoursRange(labConfig.openHour, labConfig.closeHour)})`}
                  />
                </div>
                <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full ${
                  activeSection === 'workstations'
                    ? 'bg-white dark:bg-blue-900 text-[#4070d8] dark:text-blue-200'
                    : 'bg-[#f4f6fa] dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                }`}>
                  {roomData.seats.length || 54}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSection('users')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeSection === 'users'
                    ? 'bg-[#f0f5ff] text-[#4070d8] dark:bg-blue-950/40 dark:text-blue-300 shadow-2xs'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-[#f8fafc] dark:hover:bg-slate-900/40 hover:text-slate-800 dark:hover:text-white font-medium'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <UserCog className={`w-4 h-4 ${activeSection === 'users' ? 'text-[#4a7cf6]' : 'text-slate-400'}`} />
                  <span>User Management</span>
                </div>
                <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full ${
                  activeSection === 'users'
                    ? 'bg-white dark:bg-blue-900 text-[#4070d8] dark:text-blue-200'
                    : 'bg-[#f4f6fa] dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                }`}>
                  {usersList.length || 0}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSection('sessions')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeSection === 'sessions'
                    ? 'bg-[#f0f5ff] text-[#4070d8] dark:bg-blue-950/40 dark:text-blue-300 shadow-2xs'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-[#f8fafc] dark:hover:bg-slate-900/40 hover:text-slate-800 dark:hover:text-white font-medium'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <History className={`w-4 h-4 ${activeSection === 'sessions' ? 'text-[#4a7cf6]' : 'text-slate-400'}`} />
                  <span>Session History</span>
                </div>
                <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full ${
                  activeSection === 'sessions'
                    ? 'bg-white dark:bg-blue-900 text-[#4070d8] dark:text-blue-200'
                    : 'bg-[#f4f6fa] dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                }`}>
                  {sessionsList.length || 0}
                </span>
              </button>
            </nav>
          </div>

          {/* Group 2: QUICK ACTIONS & TOOLS */}
          <div className="px-3 pt-4 pb-2">
            <div className="px-3 pb-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-wider uppercase">
              Management &amp; Tools
            </div>

            <nav className="space-y-1">
              <button
                type="button"
                onClick={openQrModal}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium text-slate-500 dark:text-slate-400 hover:bg-[#f8fafc] dark:hover:bg-slate-900/40 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer text-left"
              >
                <QrCode className="w-4 h-4 text-slate-400" />
                <span>Desk QR Stickers</span>
              </button>

              <button
                type="button"
                onClick={handleRefreshAll}
                disabled={isUsageLoading || isUsersLoading || isSessionsLoading}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium text-slate-500 dark:text-slate-400 hover:bg-[#f8fafc] dark:hover:bg-slate-900/40 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer text-left"
              >
                <RefreshCw className={`w-4 h-4 text-slate-400 ${isUsageLoading || isUsersLoading || isSessionsLoading ? 'animate-spin' : ''}`} />
                <span>Refresh Live Metrics</span>
              </button>
            </nav>
          </div>
        </div>

        {/* Sidebar Footer - Always visible at bottom left without scrolling */}
        <div className="p-3 border-t border-[#edf1f7] dark:border-[#232c3d] shrink-0 space-y-2 bg-white dark:bg-[#161c26]">
          {/* User Account / Profile at Bottom Left Space */}
          <DropdownMenu>
            <DropdownMenuTrigger className="w-full flex items-center justify-between p-2 rounded-xl border border-[#edf1f7] dark:border-[#232c3d] bg-white dark:bg-[#161c26] hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer text-left select-none group shadow-2xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-[#f0f5ff] dark:bg-blue-950 text-[#4a7cf6] dark:text-blue-300 text-[11px] font-bold flex items-center justify-center shrink-0">
                  {getInitials(currentUser?.fullName || 'Admin')}
                </div>
                <div className="min-w-0 flex-1 leading-tight">
                  <div className="text-xs font-bold text-slate-800 dark:text-white truncate group-hover:text-[#4a7cf6] transition-colors">
                    {getCleanShortName(currentUser?.fullName)}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate flex items-center gap-1">
                    <span>Admin</span>
                    <span>·</span>
                    <span className="text-primary hover:underline font-medium">Edit info</span>
                  </div>
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 shrink-0 ml-1" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" side="top" className="w-60 bg-white dark:bg-[#161c26] border-[#edf1f7] dark:border-[#232c3d] shadow-lg mb-1">
              <DropdownMenuLabel
                onClick={openUserDetailModal}
                className="font-normal cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-md transition-colors"
                title="Click to edit user details"
              >
                <div className="flex flex-col space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold leading-none text-slate-800 dark:text-white truncate">
                      {currentUser?.fullName || 'Administrator'}
                    </p>
                    <span className="text-[10px] text-primary font-medium hover:underline">Edit</span>
                  </div>
                  <p className="text-[11px] leading-none text-slate-400 font-mono truncate">
                    {currentUser?.email || 'admin@mfu.ac.th'}
                  </p>
                  <div className="pt-1">
                    <Badge variant="secondary" className="text-[9px] font-bold bg-[#f0f5ff] text-[#4a7cf6] dark:bg-blue-950 dark:text-blue-300">
                      {currentUser?.role || 'ADMINISTRATOR'}
                    </Badge>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={openUserDetailModal}
                className="text-xs gap-2 cursor-pointer font-medium hover:bg-slate-50 dark:hover:bg-slate-800/60"
              >
                <UserCog className="w-3.5 h-3.5 text-[#4a7cf6]" />
                Edit Profile Details
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={async () => {
                  try {
                    await logoutMutation.mutateAsync();
                  } catch {}
                  setCurrentUser(null);
                  showToast('Logged out of Admin Console.', 'info');
                  window.location.href = ROUTES.HOME;
                }}
                className="text-xs gap-2 text-destructive cursor-pointer hover:bg-rose-50 dark:hover:bg-rose-950/30"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <button
            type="button"
            onClick={() => showToast('ORS Lab Administrator Portal v2.4. Operating Hours: 09:00 - 17:00 (Bangkok).', 'info')}
            className="w-full flex items-center gap-2 text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer px-1 pt-0.5"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Help &amp; support</span>
          </button>
        </div>
      </aside>

      {/* -------------------------------------------------------------------- */}
      {/* 2. MAIN WORKSPACE AREA                                               */}
      {/* -------------------------------------------------------------------- */}
      <div className="flex-1 flex flex-col min-w-0 md:h-screen overflow-y-auto overflow-x-hidden bg-[#fafbfc] dark:bg-[#0f141c]">
        {/* Top Navbar */}
        <header className="h-16 px-4 sm:px-8 border-b border-[#edf1f7] dark:border-[#232c3d] bg-white/95 dark:bg-[#161c26]/95 backdrop-blur-sm flex items-center justify-between shrink-0">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Shield className="w-3.5 h-3.5 text-[#4a7cf6]" />
            <span className="hidden sm:inline">Admin console</span>
            <ChevronRight className="w-3 h-3 text-slate-300 dark:text-slate-600" />
            <span className="font-semibold text-slate-700 dark:text-white capitalize">
              {activeSection === 'usage'
                ? 'Usage reports'
                : activeSection === 'kpis'
                ? 'Real-time KPIs'
                : activeSection === 'workstations'
                ? 'Workstations'
                : activeSection === 'users'
                ? 'User Management'
                : 'Session History'}
            </span>
          </div>

          {/* Top Right: Theme Toggle (+ compact profile for mobile view) */}
          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />

            {/* Mobile Profile Trigger (hidden on desktop where profile is at bottom left of sidebar) */}
            <div className="md:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-1.5 p-1 rounded-full border border-[#edf1f7] dark:border-[#232c3d] bg-white dark:bg-[#161c26] select-none hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs">
                  <div className="w-6 h-6 rounded-full bg-[#f0f5ff] text-[#4a7cf6] text-[10px] font-bold flex items-center justify-center">
                    {getInitials(currentUser?.fullName || 'Admin')}
                  </div>
                  <ChevronDown className="w-3 h-3 text-slate-400 pr-0.5" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-white dark:bg-[#161c26] border-[#edf1f7] dark:border-[#232c3d] shadow-md">
                  <DropdownMenuLabel
                    onClick={openUserDetailModal}
                    className="font-normal cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-md transition-colors"
                  >
                    <div className="flex flex-col space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold leading-none text-slate-800 dark:text-white truncate">
                          {currentUser?.fullName || 'Administrator'}
                        </p>
                        <span className="text-[10px] text-primary font-medium hover:underline">Edit</span>
                      </div>
                      <p className="text-[11px] leading-none text-slate-400 font-mono truncate">
                        {currentUser?.email || 'admin@mfu.ac.th'}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={openUserDetailModal}
                    className="text-xs gap-2 cursor-pointer font-medium"
                  >
                    <UserCog className="w-3.5 h-3.5 text-[#4a7cf6]" />
                    Edit Profile Details
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={async () => {
                      try {
                        await logoutMutation.mutateAsync();
                      } catch {}
                      setCurrentUser(null);
                      showToast('Logged out of Admin Console.', 'info');
                      window.location.href = ROUTES.HOME;
                    }}
                    className="text-xs gap-2 text-destructive cursor-pointer hover:bg-rose-50"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <nav aria-label="Admin sections" className="md:hidden flex gap-1 overflow-x-auto border-b border-[#edf1f7] dark:border-[#232c3d] bg-white dark:bg-[#161c26] px-3 py-2">
          {[
            { id: 'usage' as const, label: 'Reports', icon: BarChart3 },
            { id: 'kpis' as const, label: 'KPIs', icon: Activity },
            { id: 'workstations' as const, label: 'Desks', icon: Monitor },
            { id: 'users' as const, label: 'Users', icon: UserCog },
            { id: 'sessions' as const, label: 'Sessions', icon: History },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveSection(id)}
              className={`inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-xl px-3 text-xs font-semibold transition-colors ${
                activeSection === id
                  ? 'bg-[#f0f5ff] text-[#4070d8] dark:bg-blue-950/40 dark:text-blue-300'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </nav>

        {/* Dynamic Section Content */}
        <main className="p-4 sm:p-8 space-y-6">
          {/* ================================================================ */}
          {/* SECTION 1: USAGE REPORTS (Matching Mockup)                        */}
          {/* ================================================================ */}
          {activeSection === 'usage' && (
            <div className="space-y-6">
              {/* Header Title & Responsive Actions */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-[11px] font-bold tracking-wider uppercase text-[#4a7cf6] dark:text-blue-400 mb-1">
                    Staff Administrator Console
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-800 dark:text-white">
                    Lab Management &amp; Analytics
                  </h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Workstation monitoring, session moderation, and student usage metrics.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefreshAll}
                    disabled={isUsageLoading}
                    className="h-9 px-3.5 flex-1 sm:flex-initial gap-2 text-xs font-semibold rounded-xl bg-white dark:bg-[#161c26] border-[#edf1f7] dark:border-[#232c3d] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-2xs cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isUsageLoading ? 'animate-spin' : ''}`} />
                    <span>Refresh Data</span>
                  </Button>

                  <Button
                    onClick={openQrModal}
                    size="sm"
                    className="h-9 px-3.5 flex-1 sm:flex-initial gap-2 text-xs font-semibold rounded-xl bg-[#4a7cf6] hover:bg-[#3d6fe8] text-white shadow-xs cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Desk QR Stickers</span>
                  </Button>
                </div>
              </div>

              {/* Current Lab Status Card */}
              <div className="rounded-2xl border border-[#edf1f7] dark:border-[#232c3d] bg-white dark:bg-[#161c26] p-6 shadow-[0_2px_10px_rgba(0,0,0,0.015)] space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-[#f0f5ff] dark:bg-blue-950/60 text-[#4a7cf6] flex items-center justify-center">
                      <Layers className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-bold text-sm text-slate-800 dark:text-white">SE Lab</span>
                    <span className="font-mono text-xs text-slate-400 bg-[#f4f6fa] dark:bg-slate-800 px-2 py-0.5 rounded-md font-medium">
                      SE-LAB-101
                    </span>
                  </div>
                  <div className="inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Current lab status</span>
                  </div>
                </div>

                {/* 4 Metric Columns */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-3 border-y border-[#f4f6fa] dark:border-[#232c3d]">
                  <div>
                    <div className="text-xs text-slate-400 dark:text-slate-400 flex items-center gap-1.5 font-medium">
                      <span>Occupancy rate</span>
                      <TrendingUp className="w-3 h-3 text-slate-400" />
                    </div>
                    <div className="text-3xl font-extrabold text-slate-800 dark:text-white mt-1">
                      {activePercent}%
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {occupiedCount} occupied · maintenance excluded
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-slate-400 dark:text-slate-400 flex items-center gap-1.5 font-medium">
                      <span>Free desks</span>
                      <Monitor className="w-3 h-3 text-emerald-500" />
                    </div>
                    <div className="text-3xl font-extrabold text-emerald-500 dark:text-emerald-400 mt-1">
                      {availableCount} / {totalCount}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Available workstations
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-slate-400 dark:text-slate-400 flex items-center gap-1.5 font-medium">
                      <span>Occupied desks</span>
                      <Users className="w-3 h-3 text-slate-400" />
                    </div>
                    <div className="text-3xl font-extrabold text-slate-800 dark:text-white mt-1">
                      {occupiedCount}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {occupiedCount === 0 ? 'No desks currently occupied' : `${occupiedCount} active students`}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-slate-400 dark:text-slate-400 flex items-center gap-1.5 font-medium">
                      <span>Under maintenance</span>
                      <Wrench className="w-3 h-3 text-amber-500" />
                    </div>
                    <div className="text-3xl font-extrabold text-amber-500 dark:text-amber-400 mt-1">
                      {maintenanceCount}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Unavailable for use
                    </div>
                  </div>
                </div>

                {/* Footer link to workstations */}
                <div className="flex items-center justify-between text-xs pt-1">
                  <div className="flex items-center gap-3 text-slate-400 font-medium">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span>{availableCount} free</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      <span>{maintenanceCount} under maintenance</span>
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveSection('workstations')}
                    className="inline-flex items-center gap-1 font-semibold text-[#4a7cf6] hover:text-[#3d6fe8] transition-colors cursor-pointer"
                  >
                    <span>Manage workstations ({totalCount})</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Historical Usage Dashboard */}
              <div className="rounded-2xl border border-[#edf1f7] dark:border-[#232c3d] bg-white dark:bg-[#161c26] p-6 shadow-[0_2px_10px_rgba(0,0,0,0.015)] space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-bold text-slate-800 dark:text-white">
                      Historical Usage Dashboard
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Aggregate laboratory usage hours, user attendance, and duration patterns.
                    </p>
                  </div>

                  {/* Interval & Interactive Time Period Controls */}
                  <div className="flex flex-wrap items-center gap-2.5">
                    {/* Interval Toggle */}
                    <div className="flex items-center bg-[#f4f6fa] dark:bg-slate-800/80 p-1 rounded-xl text-xs font-medium">
                      {(['daily', 'weekly', 'monthly'] as UsageInterval[]).map((iv) => (
                        <button
                          key={iv}
                          type="button"
                          onClick={() => setUsageInterval(iv)}
                          className={`px-3 py-1 rounded-lg capitalize transition-colors cursor-pointer ${
                            usageInterval === iv
                              ? 'bg-white dark:bg-[#161c26] text-slate-800 dark:text-white shadow-2xs font-bold'
                              : 'text-slate-400 hover:text-slate-700 dark:hover:text-white'
                          }`}
                        >
                          {iv}
                        </button>
                      ))}
                    </div>

                    {/* Quick Time Period Presets Dropdown */}
                    <DropdownMenu>
                      <DropdownMenuTrigger className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#edf1f7] dark:border-[#232c3d] bg-white dark:bg-[#161c26] text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors shadow-2xs cursor-pointer">
                        <Calendar className="w-3.5 h-3.5 text-[#4a7cf6]" />
                        <span>Select Period</span>
                        <ChevronDown className="w-3 h-3 text-slate-400" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 bg-white dark:bg-[#161c26] border-[#edf1f7] dark:border-[#232c3d] shadow-lg">
                        <DropdownMenuLabel className="text-[10px] uppercase font-bold text-slate-400">Time Range Presets</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleSelectPreset('7d')} className="text-xs cursor-pointer">
                          Past 7 Days
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleSelectPreset('14d')} className="text-xs cursor-pointer">
                          Past 14 Days
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleSelectPreset('30d')} className="text-xs cursor-pointer">
                          Past 30 Days (1 Month)
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleSelectPreset('90d')} className="text-xs cursor-pointer">
                          Past 90 Days (3 Months)
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleSelectPreset('year')} className="text-xs cursor-pointer">
                          Past 1 Year
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleSelectPreset('all')} className="text-xs cursor-pointer">
                          All Time
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Interactive Custom Date Range Inputs */}
                    <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 bg-white dark:bg-[#161c26] border border-[#edf1f7] dark:border-[#232c3d] px-3 py-1.5 rounded-xl font-medium shadow-2xs">
                      <label htmlFor="dashboard-start-date" className="sr-only">Start Date</label>
                      <input
                        id="dashboard-start-date"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="bg-transparent font-mono text-xs text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
                        title="Start Date"
                      />
                      <span className="text-slate-400 font-normal">to</span>
                      <label htmlFor="dashboard-end-date" className="sr-only">End Date</label>
                      <input
                        id="dashboard-end-date"
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="bg-transparent font-mono text-xs text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
                        title="End Date"
                      />
                    </div>
                  </div>
                </div>

                {/* 4 Summary Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-3 border-y border-[#f4f6fa] dark:border-[#232c3d]">
                  <div>
                    <div className="text-xs text-slate-400 flex items-center gap-1.5 font-medium">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span>Total Unique Users</span>
                    </div>
                    <div className="text-2xl sm:text-3xl font-extrabold text-slate-800 dark:text-white mt-1">
                      {usageData?.summary?.totalUsers ?? 0}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-slate-400 flex items-center gap-1.5 font-medium">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>Cumulative Hours</span>
                    </div>
                    <div className="text-2xl sm:text-3xl font-extrabold text-slate-800 dark:text-white mt-1">
                      {usageData?.summary?.totalUsageHours ? `${usageData.summary.totalUsageHours.toFixed(1)} h` : '0.0 h'}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-slate-400 flex items-center gap-1.5 font-medium">
                      <Layers className="w-3.5 h-3.5 text-slate-400" />
                      <span>Total Sessions</span>
                    </div>
                    <div className="text-2xl sm:text-3xl font-extrabold text-slate-800 dark:text-white mt-1">
                      {usageData?.summary?.totalSessions ?? 0}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-slate-400 flex items-center gap-1.5 font-medium">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>Avg Session Time</span>
                    </div>
                    <div className="text-2xl sm:text-3xl font-extrabold text-slate-800 dark:text-white mt-1">
                      {usageData?.summary?.avgSessionMinutes ?? 0} min
                    </div>
                  </div>
                </div>

                {/* Timeline Area Chart */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700 dark:text-white">
                      Usage timeline / <span className="capitalize font-semibold text-[#4a7cf6]">{usageInterval}</span>
                    </span>
                    <span className="flex items-center gap-1.5 text-slate-400 font-medium">
                      <span className="w-3 h-1 bg-[#4a7cf6] rounded-full" />
                      <span>Usage hours</span>
                    </span>
                  </div>

                  <div className="h-60 w-full pt-2">
                    {timelineData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={timelineData}>
                          <defs>
                            <linearGradient id="usageGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#4a7cf6" stopOpacity={0.16} />
                              <stop offset="95%" stopColor="#4a7cf6" stopOpacity={0.0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f6fa" />
                          <XAxis dataKey="label" stroke="#a0aec0" fontSize={11} tickLine={false} axisLine={false} />
                          <YAxis stroke="#a0aec0" fontSize={11} tickLine={false} axisLine={false} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#2d3748',
                              borderRadius: '12px',
                              border: 'none',
                              color: '#ffffff',
                              fontSize: '12px',
                              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                            }}
                          />
                          <Area
                            type="monotone"
                            dataKey="hours"
                            stroke="#4a7cf6"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#usageGradient)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs">
                        <BarChart3 className="w-7 h-7 mb-1.5 opacity-40 text-slate-400" />
                        <span>No usage timeline recorded for this period. Select an earlier period above.</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Top Active Students Table - only appears when student data comes */}
              {topStudents.length > 0 && (
                <div className="rounded-2xl border border-[#edf1f7] dark:border-[#232c3d] bg-white dark:bg-[#161c26] shadow-[0_2px_10px_rgba(0,0,0,0.015)] overflow-hidden">
                  <div className="p-5 border-b border-[#f4f6fa] dark:border-[#232c3d] flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-base text-slate-800 dark:text-white">Top active students</h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Highest total usage hours in the selected period.
                      </p>
                    </div>
                    <Badge variant="outline" className="text-[10px] font-semibold border-[#edf1f7] bg-[#fbfcfd] text-slate-500">
                      Top {topStudents.length} {topStudents.length === 1 ? 'student' : 'students'}
                    </Badge>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="border-b border-[#edf1f7] dark:border-[#232c3d] text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-[#fbfcfd] dark:bg-[#161c26]">
                        <tr>
                          <th className="py-3.5 px-6">Student Name</th>
                          <th className="py-3.5 px-6">Email</th>
                          <th className="py-3.5 px-6">Sessions</th>
                          <th className="py-3.5 px-6 text-right">Total Hours ↓</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#f4f6fa] dark:divide-[#232c3d]">
                        {topStudents.map((st, i) => (
                          <tr key={i} className="hover:bg-[#fbfcfd] dark:hover:bg-slate-900/30 transition-colors">
                            <td className="py-3.5 px-6">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-[#f0f5ff] dark:bg-blue-950/60 text-[#4a7cf6] dark:text-blue-400 text-xs font-bold flex items-center justify-center">
                                  {getInitials(st.studentName)}
                                </div>
                                <span className="font-semibold text-slate-800 dark:text-white">{st.studentName}</span>
                              </div>
                            </td>
                            <td className="py-3.5 px-6 font-mono text-slate-400 text-xs">{st.email}</td>
                            <td className="py-3.5 px-6 font-semibold text-slate-700 dark:text-slate-200">{st.sessionsCount}</td>
                            <td className="py-3.5 px-6 text-right">
                              <div className="inline-flex items-center gap-3 justify-end w-44">
                                <div className="w-24 h-2 rounded-full bg-[#edf1f7] dark:bg-slate-800 overflow-hidden">
                                  <div
                                    className="h-full bg-[#4a7cf6] rounded-full"
                                    style={{ width: `${Math.min(100, (st.totalHours / 8) * 100)}%` }}
                                  />
                                </div>
                                <span className="font-mono font-bold text-slate-700 dark:text-white w-12 text-right">
                                  {st.totalHours.toFixed(1)}h
                                </span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================================================================ */}
          {/* SECTION 2: WORKSTATIONS (SEAT MANAGEMENT CRUD)                   */}
          {/* ================================================================ */}
          {activeSection === 'workstations' && (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                    Workstation &amp; Seat Management
                  </h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Configure physical desks, group tables, maintenance status, and QR codes.
                  </p>
                </div>

                <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
                  {/* View Mode Toggle: Table vs 2D Map */}
                  <div className="flex items-center p-1 bg-[#f0f4fa] dark:bg-slate-800 rounded-xl border border-[#edf1f7] dark:border-slate-700">
                    <button
                      type="button"
                      onClick={() => setWorkstationViewMode('table')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        workstationViewMode === 'table'
                          ? 'bg-white dark:bg-[#111827] text-[#4070d8] dark:text-blue-400 shadow-2xs font-bold'
                          : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                      }`}
                    >
                      <Monitor className="w-3.5 h-3.5" />
                      <span>Table View</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setWorkstationViewMode('map')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        workstationViewMode === 'map'
                          ? 'bg-white dark:bg-[#111827] text-[#4070d8] dark:text-blue-400 shadow-2xs font-bold'
                          : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                      }`}
                    >
                      <LayoutGrid className="w-3.5 h-3.5" />
                      <span>2D Map View</span>
                    </button>
                  </div>

                  <Button
                    variant="outline"
                    onClick={handleOpenAddWorkspace}
                    size="sm"
                    className="gap-2 text-xs font-semibold rounded-xl bg-white dark:bg-[#111827] border-[#edf1f7] dark:border-[#1f293d] text-slate-700 dark:text-slate-300 hover:bg-[#f8fafc] shadow-2xs cursor-pointer"
                  >
                    <Layers className="w-3.5 h-3.5 text-[#4a7cf6]" />
                    <span>Create Workspace</span>
                  </Button>
                  <Button
                    onClick={() => handleOpenAddSeat()}
                    size="sm"
                    className="gap-2 text-xs font-bold rounded-xl bg-[#4a7cf6] text-white hover:bg-[#3d6fe8] shadow-sm shadow-[#4a7cf6]/20 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Workstation</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={openQrModal}
                    className="gap-2 text-xs font-semibold rounded-xl bg-white dark:bg-[#111827] border-[#edf1f7] dark:border-[#1f293d] text-slate-700 dark:text-slate-300 hover:bg-[#f8fafc] shadow-2xs"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print QR Codes</span>
                  </Button>
                </div>
              </div>

              {/* Workstation Control: Allow & Disable Button, Adjust Time with Update Button */}
              <div className="p-3 sm:px-4 rounded-2xl border border-[#edf1f7] dark:border-[#1f293d] bg-white dark:bg-[#111827] shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-wrap items-center justify-between gap-3">
                {/* Allow and Disable Button */}
                <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => handleSetWorkstationsAllowed(true)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      labConfig.workstationsEnabled
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Allow
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetWorkstationsAllowed(false)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      !labConfig.workstationsEnabled
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Disable
                  </button>
                </div>

                {/* Adjust Time with Update Button */}
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Open Hour Stepper */}
                  <div className="flex items-center gap-1 bg-[#f8fafc] dark:bg-slate-900 border border-[#edf1f7] dark:border-slate-800 rounded-xl px-2 py-1 shadow-3xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-1">
                      Open
                    </span>
                    <button
                      type="button"
                      disabled={tempOpenHour <= 6}
                      onClick={() => setTempOpenHour((h) => Math.max(6, Math.min(tempCloseHour - 1, h - 1)))}
                      className="h-6 w-6 rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 disabled:opacity-30 cursor-pointer"
                      title="Open 1 hour earlier"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-xs font-mono font-bold px-1 text-slate-800 dark:text-slate-200 min-w-[62px] text-center">
                      {formatLabHour(tempOpenHour)}
                    </span>
                    <button
                      type="button"
                      disabled={tempOpenHour >= tempCloseHour - 1}
                      onClick={() => setTempOpenHour((h) => Math.min(tempCloseHour - 1, h + 1))}
                      className="h-6 w-6 rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 disabled:opacity-30 cursor-pointer"
                      title="Open 1 hour later"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Close Hour Stepper */}
                  <div className="flex items-center gap-1 bg-[#f8fafc] dark:bg-slate-900 border border-[#edf1f7] dark:border-slate-800 rounded-xl px-2 py-1 shadow-3xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-1">
                      Close
                    </span>
                    <button
                      type="button"
                      disabled={tempCloseHour <= tempOpenHour + 1}
                      onClick={() => setTempCloseHour((h) => Math.max(tempOpenHour + 1, h - 1))}
                      className="h-6 w-6 rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 disabled:opacity-30 cursor-pointer"
                      title="Close 1 hour earlier"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-xs font-mono font-bold px-1 text-slate-800 dark:text-slate-200 min-w-[62px] text-center">
                      {formatLabHour(tempCloseHour)}
                    </span>
                    <button
                      type="button"
                      disabled={tempCloseHour >= 23}
                      onClick={() => setTempCloseHour((h) => Math.min(23, h + 1))}
                      className="h-6 w-6 rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 disabled:opacity-30 cursor-pointer"
                      title="Close 1 hour later"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Update Button */}
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleUpdateLabHours}
                    className="h-8 px-3.5 rounded-xl bg-[#4a7cf6] text-white hover:bg-[#3d6fe8] text-xs font-bold gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Update</span>
                  </Button>
                </div>
              </div>

              {workstationViewMode === 'table' ? (
                <>
                  {/* Filters Bar */}
              <div className="p-4 rounded-2xl border border-[#edf1f7] dark:border-[#1f293d] bg-white dark:bg-[#111827] shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative w-64">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <Input
                      placeholder="Search seat code..."
                      value={seatSearch}
                      onChange={(e) => setSeatSearch(e.target.value)}
                      className="pl-9 h-9 text-xs rounded-xl border-[#edf1f7] dark:border-slate-700 bg-[#f8fafc] dark:bg-slate-900 focus:bg-white"
                    />
                  </div>

                  {/* Pod Station Filter using Shadcn DropdownMenu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger className="h-9 px-3 text-xs rounded-xl border border-[#edf1f7] dark:border-slate-700 bg-white dark:bg-slate-900 font-semibold text-slate-700 dark:text-slate-200 flex items-center justify-between gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-2xs outline-none cursor-pointer">
                      <span>{seatPodFilter === 'ALL' ? 'All Stations' : seatPodFilter}</span>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-48 p-1 z-50 bg-white dark:bg-[#161c26] border-[#edf1f7] dark:border-[#232c3d] shadow-lg rounded-xl max-h-60 overflow-y-auto">
                      <DropdownMenuItem
                        onClick={() => setSeatPodFilter('ALL')}
                        className={`text-xs py-2 px-2.5 rounded-lg cursor-pointer flex items-center justify-between ${
                          seatPodFilter === 'ALL' ? 'bg-[#f0f5ff] text-[#4070d8] font-bold dark:bg-blue-950 dark:text-blue-300' : 'text-slate-700 dark:text-slate-200'
                        }`}
                      >
                        <span>All Stations</span>
                        {seatPodFilter === 'ALL' && <Check className="w-3.5 h-3.5 text-[#4a7cf6]" />}
                      </DropdownMenuItem>
                      {uniquePods.map((p) => (
                        <DropdownMenuItem
                          key={p}
                          onClick={() => setSeatPodFilter(p)}
                          className={`text-xs py-2 px-2.5 rounded-lg cursor-pointer flex items-center justify-between ${
                            seatPodFilter === p ? 'bg-[#f0f5ff] text-[#4070d8] font-bold dark:bg-blue-950 dark:text-blue-300' : 'text-slate-700 dark:text-slate-200'
                          }`}
                        >
                          <span>{p}</span>
                          {seatPodFilter === p && <Check className="w-3.5 h-3.5 text-[#4a7cf6]" />}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Status Filter using Shadcn DropdownMenu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger className="h-9 px-3 text-xs rounded-xl border border-[#edf1f7] dark:border-slate-700 bg-white dark:bg-slate-900 font-semibold text-slate-700 dark:text-slate-200 flex items-center justify-between gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-2xs outline-none cursor-pointer">
                      <span>
                        {seatStatusFilter === 'ALL'
                          ? 'All Statuses'
                          : seatStatusFilter === 'AVAILABLE'
                          ? 'Available'
                          : seatStatusFilter === 'OCCUPIED'
                          ? 'Occupied'
                          : seatStatusFilter === 'MAINTENANCE'
                          ? 'Maintenance'
                          : 'Reserved'}
                      </span>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-44 p-1 z-50 bg-white dark:bg-[#161c26] border-[#edf1f7] dark:border-[#232c3d] shadow-lg rounded-xl">
                      {[
                        { value: 'ALL', label: 'All Statuses' },
                        { value: 'AVAILABLE', label: 'Available' },
                        { value: 'OCCUPIED', label: 'Occupied' },
                        { value: 'MAINTENANCE', label: 'Maintenance' },
                        { value: 'RESERVED', label: 'Reserved' },
                      ].map((item) => (
                        <DropdownMenuItem
                          key={item.value}
                          onClick={() => setSeatStatusFilter(item.value)}
                          className={`text-xs py-2 px-2.5 rounded-lg cursor-pointer flex items-center justify-between ${
                            seatStatusFilter === item.value
                              ? 'bg-[#f0f5ff] text-[#4070d8] font-bold dark:bg-blue-950 dark:text-blue-300'
                              : 'text-slate-700 dark:text-slate-200'
                          }`}
                        >
                          <span>{item.label}</span>
                          {seatStatusFilter === item.value && <Check className="w-3.5 h-3.5 text-[#4a7cf6]" />}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-xs text-slate-500 font-medium">
                    Showing <strong className="text-slate-900 dark:text-white">{filteredSeats.length}</strong> of {roomData.seats.length} workstations
                  </div>
                </div>
              </div>

              {/* Seats Table */}
              <div className="rounded-2xl border border-[#edf1f7] dark:border-[#1f293d] bg-white dark:bg-[#111827] shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-[#edf1f7] dark:border-[#1f293d] text-[10px] font-extrabold text-slate-400 uppercase tracking-wider bg-[#f8fafc] dark:bg-[#161e2e]">
                      <tr>
                        <th className="py-3 px-6">Workstation</th>
                        <th className="py-3 px-6">Station / Pod</th>
                        <th className="py-3 px-6">Type</th>
                        <th className="py-3 px-6">Status</th>
                        <th className="py-3 px-6">QR Token</th>
                        <th className="py-3 px-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#edf1f7] dark:divide-[#1f293d]">
                      {paginatedSeats.map((s) => (
                        <tr key={s.id} className="hover:bg-[#f8fafc]/70 dark:hover:bg-slate-900/30 transition-colors">
                          <td className="py-3.5 px-6">
                            <div className="flex items-center gap-2.5">
                              <div className="w-10 h-8 rounded-lg bg-[#f0f5ff] dark:bg-blue-950/60 text-[#4a7cf6] flex items-center justify-center font-bold">
                                {s.seatCode.replace(/^SEAT-/, '')}
                              </div>
                              <span className="font-bold text-slate-900 dark:text-white">{s.seatCode}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-6 font-semibold text-slate-800 dark:text-slate-200">{s.podLabel}</td>
                          <td className="py-3.5 px-6">
                            <span className="font-mono text-[11px] text-slate-400">
                              {s.tableType === 'GROUP' ? `Group (Table ${s.groupTableId || 1})` : 'Individual'}
                            </span>
                          </td>
                          <td className="py-3.5 px-6">
                            <Badge
                              variant="outline"
                              className={`text-[10px] font-bold ${
                                s.status === 'AVAILABLE'
                                  ? 'border-emerald-200 text-emerald-700 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-300'
                                  : s.status === 'OCCUPIED'
                                  ? 'border-blue-200 text-blue-700 bg-blue-50 dark:bg-blue-950/30 dark:text-blue-300'
                                  : s.status === 'MAINTENANCE'
                                  ? 'border-amber-200 text-amber-700 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-300'
                                  : 'border-purple-200 text-purple-700 bg-purple-50 dark:bg-purple-950/30 dark:text-purple-300'
                              }`}
                            >
                              {s.status}
                            </Badge>
                          </td>
                          <td className="py-3.5 px-6 font-mono text-[11px] text-slate-400">
                            <div className="flex items-center gap-2">
                              <span>{s.qrToken}</span>
                              <button
                                type="button"
                                onClick={() => handleDownloadSeatQr(s)}
                                title={`Download QR code for ${s.seatCode}`}
                                className="p-1 text-slate-400 hover:text-[#4a7cf6] hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                          <td className="py-3.5 px-6 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => onToggleSeatMaintenance(s)}
                                className={`h-7 px-2 text-[11px] gap-1 font-semibold rounded-lg ${
                                  s.status === 'MAINTENANCE' ? 'text-emerald-600 border-emerald-300 bg-emerald-50' : 'text-amber-600 border-amber-300 bg-amber-50'
                                }`}
                                title="Toggle Maintenance"
                              >
                                <Wrench className="w-3 h-3" />
                                <span>{s.status === 'MAINTENANCE' ? 'Enable' : 'Maintain'}</span>
                              </Button>

                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleOpenEditSeat(s)}
                                className="h-7 w-7 p-0 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                                title="Edit Seat"
                              >
                                <Edit className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
                              </Button>

                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteSeat(s)}
                                className="h-7 w-7 p-0 rounded-lg text-destructive hover:bg-destructive/10"
                                title="Delete Seat"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <TablePagination
                  currentPage={seatPage}
                  totalItems={filteredSeats.length}
                  pageSize={seatPageSize}
                  onPageChange={setSeatPage}
                  onPageSizeChange={setSeatPageSize}
                  pageSizeOptions={[10, 25, 50, 100, 150]}
                />
              </div>
            </>
          ) : (
            <div className="space-y-6">
              {/* Interactive 2D Floor Plan in Admin Mode */}
              <FloorPlan2D
                room={roomData.room}
                seats={roomData.seats}
                selectedSeat={adminSelectedSeat}
                onSelectSeat={(s) => {
                  setAdminSelectedSeat(s);
                  handleOpenEditSeat(s);
                }}
                isAdminMode={true}
              />

              {/* Admin 2D Map Interactive Management Panel */}
              <div className="p-5 rounded-2xl border border-[#edf1f7] dark:border-[#1f293d] bg-white dark:bg-[#111827] shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
                {/* Time Control Status Banner for 2D Map */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <Clock className={`w-4 h-4 ${!labConfig.workstationsEnabled ? 'text-rose-500' : labStatus.isOpen ? 'text-emerald-500' : 'text-amber-500'}`} />
                    <span className="font-semibold text-slate-700 dark:text-slate-200">
                      {!labConfig.workstationsEnabled
                        ? 'Workstations are currently disabled by Administrator'
                        : labStatus.isOpen
                        ? `Operating Window Active: ${formatLabHoursRange(labConfig.openHour, labConfig.closeHour)}`
                        : `Outside Operating Window (${formatLabHoursRange(labConfig.openHour, labConfig.closeHour)})`}
                    </span>
                    <span className="text-slate-400">·</span>
                    <span className="text-slate-500 dark:text-slate-400">
                      {!labConfig.workstationsEnabled
                        ? 'Reservations are locked for all workstations'
                        : labStatus.isOpen
                        ? `Closing deadline at ${formatLabHour(labConfig.closeHour)} (${Math.floor(labStatus.minutesUntilClose / 60)}h ${labStatus.minutesUntilClose % 60}m remaining)`
                        : `Desk reservations unlock at ${formatLabHour(labConfig.openHour)}`}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsTimeControlModalOpen(true)}
                    className="h-7 text-[11px] font-bold text-[#4a7cf6] hover:bg-[#4a7cf6]/10 px-2 cursor-pointer"
                  >
                    View Schedule Policy →
                  </Button>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#edf1f7] dark:border-[#1f293d] pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#f0f5ff] dark:bg-blue-950/60 text-[#4a7cf6] flex items-center justify-center font-bold text-sm">
                      {adminSelectedSeat ? adminSelectedSeat.seatCode.replace(/^SEAT-/, '') : <Monitor className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                          {adminSelectedSeat ? `Workstation ${adminSelectedSeat.seatCode}` : 'Workstation Quick Management'}
                        </h3>
                        {adminSelectedSeat && (
                          <Badge
                            variant="outline"
                            className={`text-[10px] font-bold ${
                              adminSelectedSeat.status === 'AVAILABLE'
                                ? 'border-emerald-200 text-emerald-700 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-300'
                                : adminSelectedSeat.status === 'OCCUPIED'
                                ? 'border-blue-200 text-blue-700 bg-blue-50 dark:bg-blue-950/30 dark:text-blue-300'
                                : adminSelectedSeat.status === 'MAINTENANCE'
                                ? 'border-amber-200 text-amber-700 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-300'
                                : 'border-purple-200 text-purple-700 bg-purple-50 dark:bg-purple-950/30 dark:text-purple-300'
                            }`}
                          >
                            {adminSelectedSeat.status}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {adminSelectedSeat
                          ? `${adminSelectedSeat.podLabel} · ${adminSelectedSeat.tableType === 'GROUP' ? `Group Table ${adminSelectedSeat.groupTableId || 1}` : 'Individual Desk'}`
                          : 'Click any desk in the 2D floor plan above to inspect, toggle maintenance, edit, or delete.'}
                      </p>
                    </div>
                  </div>

                  {/* Action buttons for selected workstation */}
                  {adminSelectedSeat ? (
                    <div className="flex items-center gap-2 flex-wrap">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          onToggleSeatMaintenance(adminSelectedSeat);
                          setAdminSelectedSeat((prev) =>
                            prev ? { ...prev, status: (prev.status === 'MAINTENANCE' ? 'AVAILABLE' : 'MAINTENANCE') as SeatStatus } : null,
                          );
                        }}
                        className={`h-8 px-3 text-xs gap-1.5 font-semibold rounded-xl ${
                          adminSelectedSeat.status === 'MAINTENANCE'
                            ? 'text-emerald-600 border-emerald-300 bg-emerald-50 hover:bg-emerald-100'
                            : 'text-amber-600 border-amber-300 bg-amber-50 hover:bg-amber-100'
                        }`}
                      >
                        <Wrench className="w-3.5 h-3.5" />
                        <span>{adminSelectedSeat.status === 'MAINTENANCE' ? 'Mark Available' : 'Put Under Maintenance'}</span>
                      </Button>

                      <Button
                        size="sm"
                        onClick={() => handleOpenEditSeat(adminSelectedSeat)}
                        className="h-8 px-3 text-xs font-bold rounded-xl bg-[#4a7cf6] hover:bg-[#3d6fe8] text-white shadow-2xs gap-1.5"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span>Edit Workstation</span>
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteSeat(adminSelectedSeat)}
                        className="h-8 px-3 text-xs font-bold rounded-xl text-destructive hover:bg-destructive/10 gap-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setAdminSelectedSeat(null)}
                        className="h-8 px-2.5 text-xs text-slate-500 rounded-xl"
                      >
                        Deselect
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleOpenAddWorkspace}
                        className="h-8 px-3 text-xs font-semibold rounded-xl bg-white dark:bg-[#111827] border-[#edf1f7] dark:border-[#1f293d] text-slate-700 dark:text-slate-300 hover:bg-[#f8fafc] shadow-2xs gap-1.5 cursor-pointer"
                      >
                        <Layers className="w-3.5 h-3.5 text-[#4a7cf6]" />
                        <span>Create Workspace</span>
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleOpenAddSeat()}
                        className="h-8 px-3 text-xs font-bold rounded-xl bg-[#4a7cf6] text-white hover:bg-[#3d6fe8] shadow-2xs gap-1.5 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Workstation</span>
                      </Button>
                    </div>
                  )}
                </div>

                {/* Selected workstation details metadata grid */}
                {adminSelectedSeat && (
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs pt-1">
                    <div className="p-3 rounded-xl bg-[#f8fafc] dark:bg-slate-900/60 border border-[#edf1f7] dark:border-slate-800">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Station Pod</span>
                      <span className="font-extrabold text-slate-800 dark:text-white mt-0.5 block">{adminSelectedSeat.podLabel}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-[#f8fafc] dark:bg-slate-900/60 border border-[#edf1f7] dark:border-slate-800">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Workspace Type</span>
                      <span className="font-extrabold text-slate-800 dark:text-white mt-0.5 block">
                        {adminSelectedSeat.tableType === 'GROUP' ? `Group (Table ${adminSelectedSeat.groupTableId || 1})` : 'Individual Desk'}
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-[#f8fafc] dark:bg-slate-900/60 border border-[#edf1f7] dark:border-slate-800 flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">QR Token Code</span>
                        <span className="font-mono text-[11px] font-semibold text-slate-700 dark:text-slate-300 truncate mt-0.5 block">
                          {adminSelectedSeat.qrToken}
                        </span>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDownloadSeatQr(adminSelectedSeat)}
                        title={`Download QR code for ${adminSelectedSeat.seatCode}`}
                        className="h-7 px-2 text-[10px] gap-1 font-bold text-[#4a7cf6] hover:bg-[#4a7cf6]/10 rounded-lg cursor-pointer shrink-0"
                      >
                        <Download className="w-3 h-3" />
                        <span>Download</span>
                      </Button>
                    </div>
                    <div className="p-3 rounded-xl bg-[#f8fafc] dark:bg-slate-900/60 border border-[#edf1f7] dark:border-slate-800">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Current Usage</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300 mt-0.5 block">
                        {adminSelectedSeat.currentSession
                          ? `Occupied by ${adminSelectedSeat.currentSession.userName}`
                          : adminSelectedSeat.status === 'MAINTENANCE'
                          ? 'Under repair'
                          : 'Available for check-in'}
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-[#f8fafc] dark:bg-slate-900/60 border border-[#edf1f7] dark:border-slate-800">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Time Control (9am-5pm)</span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${labStatus.isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                        <span className={`font-bold ${labStatus.isOpen ? 'text-emerald-700 dark:text-emerald-300' : 'text-amber-700 dark:text-amber-300'}`}>
                          {labStatus.isOpen ? 'Check-in Open' : 'Closed Outside Hours'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

          {/* ================================================================ */}
          {/* SECTION 3: USER MANAGEMENT & ACCESS CONTROL (CRUD & ROLE CONTROL) */}
          {/* ================================================================ */}
          {activeSection === 'users' && (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                    User Management &amp; Access Control
                  </h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Manage student accounts, staff administrators, roles, and credentials.
                  </p>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  <Button
                    onClick={handleOpenAddUser}
                    size="sm"
                    className="gap-2 text-xs font-bold rounded-xl bg-[#4a7cf6] text-white hover:bg-[#3d6fe8] shadow-sm shadow-[#4a7cf6]/20 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add New User</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => refetchUsers()}
                    disabled={isUsersLoading}
                    className="gap-2 text-xs font-semibold rounded-xl bg-white dark:bg-[#111827] border-[#edf1f7] dark:border-[#1f293d] text-slate-700 dark:text-slate-300 hover:bg-[#f8fafc] shadow-2xs"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isUsersLoading ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                  </Button>
                </div>
              </div>

              {/* Filters Bar */}
              <div className="p-4 rounded-2xl border border-[#edf1f7] dark:border-[#1f293d] bg-white dark:bg-[#111827] shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative w-72">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <Input
                      placeholder="Search student ID, name, email..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className="pl-9 h-9 text-xs rounded-xl border-[#edf1f7] dark:border-slate-700 bg-[#f8fafc] dark:bg-slate-900 focus:bg-white"
                    />
                  </div>

                  {/* User Role Filter using Shadcn DropdownMenu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger className="h-9 px-3 text-xs rounded-xl border border-[#edf1f7] dark:border-slate-700 bg-white dark:bg-slate-900 font-semibold text-slate-700 dark:text-slate-200 flex items-center justify-between gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-2xs outline-none cursor-pointer">
                      <span>
                        {userRoleFilter === 'ALL'
                          ? 'All Roles'
                          : userRoleFilter === 'STUDENT'
                          ? 'Students only'
                          : 'Administrators only'}
                      </span>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-48 p-1 z-50 bg-white dark:bg-[#161c26] border-[#edf1f7] dark:border-[#232c3d] shadow-lg rounded-xl">
                      {[
                        { value: 'ALL', label: 'All Roles' },
                        { value: 'STUDENT', label: 'Students only' },
                        { value: 'ADMINISTRATOR', label: 'Administrators only' },
                      ].map((item) => (
                        <DropdownMenuItem
                          key={item.value}
                          onClick={() => setUserRoleFilter(item.value as any)}
                          className={`text-xs py-2 px-2.5 rounded-lg cursor-pointer flex items-center justify-between ${
                            userRoleFilter === item.value
                              ? 'bg-[#f0f5ff] text-[#4070d8] font-bold dark:bg-blue-950 dark:text-blue-300'
                              : 'text-slate-700 dark:text-slate-200'
                          }`}
                        >
                          <span>{item.label}</span>
                          {userRoleFilter === item.value && <Check className="w-3.5 h-3.5 text-[#4a7cf6]" />}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="text-xs text-slate-500 font-medium">
                  Showing <strong className="text-slate-900 dark:text-white">{filteredUsers.length}</strong> registered users
                </div>
              </div>

              {/* Users Table */}
              <div className="rounded-2xl border border-[#edf1f7] dark:border-[#1f293d] bg-white dark:bg-[#111827] shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-[#edf1f7] dark:border-[#1f293d] text-[10px] font-extrabold text-slate-400 uppercase tracking-wider bg-[#f8fafc] dark:bg-[#161e2e]">
                      <tr>
                        <th className="py-3 px-6">User Account</th>
                        <th className="py-3 px-6">Student ID / Username</th>
                        <th className="py-3 px-6">Email Address</th>
                        <th className="py-3 px-6">System Role</th>
                        <th className="py-3 px-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#edf1f7] dark:divide-[#1f293d]">
                      {paginatedUsers.map((u) => {
                        const isAdmin = u.role === 'ADMINISTRATOR' || u.role === 'ROLE_ADMIN';
                        return (
                          <tr key={u.id} className="hover:bg-[#f8fafc]/70 dark:hover:bg-slate-900/30 transition-colors">
                            <td className="py-3.5 px-6">
                              <div className="flex items-center gap-3">
                                <div
                                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                                    isAdmin
                                      ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                                      : 'bg-[#f0f5ff] dark:bg-blue-950 text-[#4a7cf6] dark:text-blue-300'
                                  }`}
                                >
                                  {getInitials(u.fullName || u.username)}
                                </div>
                                <div>
                                  <div className="font-bold text-slate-900 dark:text-white">
                                    {u.fullName || u.username}
                                  </div>
                                  <div className="text-[10px] text-slate-400">ID #{u.id}</div>
                                </div>
                              </div>
                            </td>

                            <td className="py-3.5 px-6 font-mono text-xs font-semibold text-slate-800 dark:text-slate-200">
                              {u.username || '—'}
                            </td>

                            <td className="py-3.5 px-6 font-mono text-slate-500 dark:text-slate-400 text-xs">
                              {u.email}
                            </td>

                            <td className="py-3.5 px-6">
                              <Badge
                                variant="outline"
                                className={`text-[10px] font-bold gap-1 ${
                                  isAdmin
                                    ? 'border-amber-300 text-amber-800 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-300'
                                    : 'border-slate-200 text-slate-700 bg-slate-50 dark:bg-slate-800/60 dark:text-slate-300 font-semibold'
                                }`}
                              >
                                {isAdmin && <Shield className="w-2.5 h-2.5" />}
                                <span>{isAdmin ? 'ADMINISTRATOR' : 'STUDENT'}</span>
                              </Badge>
                            </td>

                            <td className="py-3.5 px-6 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleOpenEditUser(u)}
                                  className="h-7 px-2.5 text-xs font-semibold gap-1 rounded-lg border-[#edf1f7] hover:bg-[#f8fafc]"
                                >
                                  <Edit className="w-3 h-3 text-slate-500" />
                                  <span>Edit &amp; Role</span>
                                </Button>

                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setSessionUserFilter(String(u.id));
                                    setActiveSection('sessions');
                                  }}
                                  className="h-7 px-2 text-xs font-medium text-slate-500 hover:text-slate-900 rounded-lg"
                                  title="View User Sessions"
                                >
                                  <History className="w-3.5 h-3.5" />
                                </Button>

                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDeleteUser(u)}
                                  disabled={u.id === currentUser?.id}
                                  className="h-7 w-7 p-0 rounded-lg text-destructive hover:bg-destructive/10 disabled:opacity-30"
                                  title="Delete User"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <TablePagination
                  currentPage={userPage}
                  totalItems={filteredUsers.length}
                  pageSize={userPageSize}
                  onPageChange={setUserPage}
                  onPageSizeChange={setUserPageSize}
                  pageSizeOptions={[10, 25, 50, 100, 150]}
                />
              </div>
            </div>
          )}

          {/* ================================================================ */}
          {/* SECTION 4: SESSION HISTORY (PER-USER DRILL-DOWN & MODERATION)     */}
          {/* ================================================================ */}
          {activeSection === 'sessions' && (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                    Lab Session Monitoring &amp; History
                  </h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Live workstation tracking, individual user session logs, and moderation.
                  </p>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetchSessions()}
                  disabled={isSessionsLoading}
                  className="gap-2 text-xs font-semibold rounded-xl shrink-0 bg-white dark:bg-[#111827] border-[#edf1f7] dark:border-[#1f293d] text-slate-700 dark:text-slate-300 hover:bg-[#f8fafc] shadow-2xs"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSessionsLoading ? 'animate-spin' : ''}`} />
                  <span>Refresh Sessions</span>
                </Button>
              </div>

              {/* Filters Bar */}
              <div className="p-4 rounded-2xl border border-[#edf1f7] dark:border-[#1f293d] bg-white dark:bg-[#111827] shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3">
                  {/* Filter by User using Shadcn DropdownMenu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger className="h-9 px-3 text-xs rounded-xl border border-[#edf1f7] dark:border-slate-700 bg-white dark:bg-slate-900 font-semibold text-slate-700 dark:text-slate-200 flex items-center justify-between gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-2xs outline-none cursor-pointer max-w-[220px]">
                      <span className="truncate">
                        {sessionUserFilter === 'ALL'
                          ? 'All Students'
                          : usersList.find((u) => String(u.id) === sessionUserFilter)?.fullName || `User #${sessionUserFilter}`}
                      </span>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-56 p-1 z-50 bg-white dark:bg-[#161c26] border-[#edf1f7] dark:border-[#232c3d] shadow-lg rounded-xl max-h-64 overflow-y-auto">
                      <DropdownMenuItem
                        onClick={() => setSessionUserFilter('ALL')}
                        className={`text-xs py-2 px-2.5 rounded-lg cursor-pointer flex items-center justify-between ${
                          sessionUserFilter === 'ALL' ? 'bg-[#f0f5ff] text-[#4070d8] font-bold dark:bg-blue-950 dark:text-blue-300' : 'text-slate-700 dark:text-slate-200'
                        }`}
                      >
                        <span>All Students</span>
                        {sessionUserFilter === 'ALL' && <Check className="w-3.5 h-3.5 text-[#4a7cf6]" />}
                      </DropdownMenuItem>
                      {usersList.map((u) => (
                        <DropdownMenuItem
                          key={u.id}
                          onClick={() => setSessionUserFilter(String(u.id))}
                          className={`text-xs py-2 px-2.5 rounded-lg cursor-pointer flex items-center justify-between ${
                            sessionUserFilter === String(u.id) ? 'bg-[#f0f5ff] text-[#4070d8] font-bold dark:bg-blue-950 dark:text-blue-300' : 'text-slate-700 dark:text-slate-200'
                          }`}
                        >
                          <span className="truncate">{u.fullName || u.username} ({u.username})</span>
                          {sessionUserFilter === String(u.id) && <Check className="w-3.5 h-3.5 text-[#4a7cf6] shrink-0" />}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Filter by Status using Shadcn DropdownMenu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger className="h-9 px-3 text-xs rounded-xl border border-[#edf1f7] dark:border-slate-700 bg-white dark:bg-slate-900 font-semibold text-slate-700 dark:text-slate-200 flex items-center justify-between gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-2xs outline-none cursor-pointer">
                      <span>
                        {sessionStatusFilter === 'ALL'
                          ? 'All Statuses'
                          : sessionStatusFilter === 'ACTIVE'
                          ? 'Active now'
                          : sessionStatusFilter === 'CHECKED_OUT'
                          ? 'Checked out'
                          : 'Force terminated'}
                      </span>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-48 p-1 z-50 bg-white dark:bg-[#161c26] border-[#edf1f7] dark:border-[#232c3d] shadow-lg rounded-xl">
                      {[
                        { value: 'ALL', label: 'All Statuses' },
                        { value: 'ACTIVE', label: 'Active now' },
                        { value: 'CHECKED_OUT', label: 'Checked out' },
                        { value: 'FORCE_TERMINATED', label: 'Force terminated' },
                      ].map((item) => (
                        <DropdownMenuItem
                          key={item.value}
                          onClick={() => setSessionStatusFilter(item.value)}
                          className={`text-xs py-2 px-2.5 rounded-lg cursor-pointer flex items-center justify-between ${
                            sessionStatusFilter === item.value
                              ? 'bg-[#f0f5ff] text-[#4070d8] font-bold dark:bg-blue-950 dark:text-blue-300'
                              : 'text-slate-700 dark:text-slate-200'
                          }`}
                        >
                          <span>{item.label}</span>
                          {sessionStatusFilter === item.value && <Check className="w-3.5 h-3.5 text-[#4a7cf6]" />}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <div className="relative w-48">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <Input
                      placeholder="Filter seat..."
                      value={sessionSeatSearch}
                      onChange={(e) => setSessionSeatSearch(e.target.value)}
                      className="pl-9 h-9 text-xs rounded-xl border-[#edf1f7] dark:border-slate-700 bg-[#f8fafc] dark:bg-slate-900 focus:bg-white"
                    />
                  </div>
                </div>

                <div className="text-xs text-slate-500 font-medium">
                  Showing <strong className="text-slate-900 dark:text-white">{filteredSessions.length}</strong> session records
                </div>
              </div>

              {/* Sessions Table */}
              <div className="rounded-2xl border border-[#edf1f7] dark:border-[#1f293d] bg-white dark:bg-[#111827] shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-[#edf1f7] dark:border-[#1f293d] text-[10px] font-extrabold text-slate-400 uppercase tracking-wider bg-[#f8fafc] dark:bg-[#161e2e]">
                      <tr>
                        <th className="py-3 px-6">Session ID</th>
                        <th className="py-3 px-6">Student</th>
                        <th className="py-3 px-6">Workstation</th>
                        <th className="py-3 px-6">Checked In</th>
                        <th className="py-3 px-6">Expires / Ended</th>
                        <th className="py-3 px-6">Status</th>
                        <th className="py-3 px-6 text-right">Moderation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#edf1f7] dark:divide-[#1f293d]">
                      {paginatedSessions.length > 0 ? (
                        paginatedSessions.map((sess) => {
                          const isActive = sess.status === 'ACTIVE';
                          const checkInDate = new Date(sess.checkedInAt).toLocaleString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                          });
                          const endDate = sess.checkedOutAt
                            ? new Date(sess.checkedOutAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
                            : sess.expiresAt
                            ? new Date(sess.expiresAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
                            : '—';

                          return (
                            <tr key={sess.id} className="hover:bg-[#f8fafc]/70 dark:hover:bg-slate-900/30 transition-colors">
                              <td className="py-3.5 px-6 font-mono font-bold text-slate-400">
                                #{sess.id}
                              </td>
                              <td className="py-3.5 px-6">
                                <div className="font-bold text-slate-900 dark:text-white">
                                  {usersList.find((u) => u.id === sess.userId)?.fullName || `User #${sess.userId}`}
                                </div>
                                <div className="text-[10px] text-slate-400 font-mono">
                                  User ID: {sess.userId}
                                </div>
                              </td>
                              <td className="py-3.5 px-6">
                                <span className="font-bold text-slate-900 dark:text-white">{sess.seatCode}</span>
                                <span className="text-[11px] text-slate-400 ml-1">({sess.podLabel})</span>
                              </td>
                              <td className="py-3.5 px-6 text-slate-500 dark:text-slate-400 font-medium">{checkInDate}</td>
                              <td className="py-3.5 px-6 text-slate-500 dark:text-slate-400 font-medium">{endDate}</td>
                              <td className="py-3.5 px-6">
                                <Badge
                                  variant="outline"
                                  className={`text-[10px] font-bold ${
                                    isActive
                                      ? 'border-emerald-300 text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300'
                                      : sess.status === 'FORCE_TERMINATED'
                                      ? 'border-destructive/30 text-destructive bg-destructive/10'
                                      : 'border-slate-200 text-slate-500'
                                  }`}
                                >
                                  {isActive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse mr-1" />}
                                  {sess.status}
                                </Badge>
                              </td>
                              <td className="py-3.5 px-6 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  {isActive ? (
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      onClick={() => setTerminatingSessionId(sess.id)}
                                      className="h-7 text-xs font-semibold px-2.5 rounded-lg"
                                    >
                                      <LogOut className="w-3 h-3 mr-1" />
                                      Terminate
                                    </Button>
                                  ) : (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleDeleteSession(sess.id)}
                                      className="h-7 w-7 p-0 text-slate-400 hover:text-destructive rounded-lg"
                                      title="Delete Session Record"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={7} className="py-12 text-center text-xs text-slate-400">
                            No session records found matching the selected filters.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <TablePagination
                  currentPage={sessionPage}
                  totalItems={filteredSessions.length}
                  pageSize={sessionPageSize}
                  onPageChange={setSessionPage}
                  onPageSizeChange={setSessionPageSize}
                  pageSizeOptions={[10, 25, 50, 100, 150]}
                />
              </div>
            </div>
          )}

          {/* ================================================================ */}
          {/* SECTION 5: REAL-TIME KPIS                                         */}
          {/* ================================================================ */}
          {activeSection === 'kpis' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  Real-time Laboratory KPIs
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Live occupancy heat, station utilization breakdown, and capacity limits.
                </p>
              </div>

              {/* Station utilization cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {uniquePods.map((pod) => {
                  const podSeats = roomData.seats.filter((s) => s.podLabel === pod);
                  const podOccupied = podSeats.filter((s) => s.status === 'OCCUPIED').length;
                  const podMaint = podSeats.filter((s) => s.status === 'MAINTENANCE').length;
                  const podRate = podSeats.length > 0 ? Math.round((podOccupied / podSeats.length) * 100) : 0;

                  return (
                    <div
                      key={pod}
                      className="p-5 rounded-2xl border border-[#edf1f7] dark:border-[#1f293d] bg-white dark:bg-[#111827] shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-sm text-slate-900 dark:text-white">{pod}</span>
                        <Badge variant="outline" className="text-[10px] font-semibold border-[#edf1f7] bg-[#f8fafc] text-slate-600">
                          {podSeats.length} workstations
                        </Badge>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <span>Utilization</span>
                          <span className="font-bold text-slate-900 dark:text-white">{podRate}%</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-[#f1f4fa] dark:bg-slate-800 overflow-hidden">
                          <div
                            className="h-full bg-[#4a7cf6] rounded-full transition-all"
                            style={{ width: `${podRate}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-[#edf1f7] dark:border-[#1f293d]">
                        <span>{podOccupied} in use</span>
                        <span>{podMaint} maintenance</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* MODAL 1: ADD USER MODAL                                              */}
      {/* -------------------------------------------------------------------- */}
      <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
        <DialogContent className="sm:max-w-[440px] p-6 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground">
              Add New User Account
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Create a new student or staff administrator account in the laboratory database.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateUserSubmit} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Student ID / Username *</Label>
              <Input
                placeholder="e.g. 6531501002 or technician1"
                value={userFormStudentId}
                onChange={(e) => setUserFormStudentId(e.target.value)}
                className="text-xs font-mono"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Full Name *</Label>
              <Input
                placeholder="e.g. John Doe"
                value={userFormFullName}
                onChange={(e) => setUserFormFullName(e.target.value)}
                className="text-xs"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Email Address (Optional)</Label>
              <Input
                type="email"
                placeholder="e.g. john.doe@lamduan.mfu.ac.th"
                value={userFormEmail}
                onChange={(e) => setUserFormEmail(e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Password</Label>
              <Input
                type="text"
                placeholder="Default: StudentPass123!"
                value={userFormPassword}
                onChange={(e) => setUserFormPassword(e.target.value)}
                className="text-xs font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">System Role *</Label>
              <DropdownMenu>
                <DropdownMenuTrigger className="w-full h-9 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-semibold text-slate-700 dark:text-slate-200 flex items-center justify-between gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-2xs outline-none cursor-pointer">
                  <span>
                    {userFormRole === 'ADMINISTRATOR'
                      ? 'ADMINISTRATOR (Full Console Access & CRUD)'
                      : 'STUDENT (Workstation Reservation & Check-In)'}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-[calc(100vw-2rem)] max-w-[390px] p-1 z-50 bg-white dark:bg-[#161c26] border-[#edf1f7] dark:border-[#232c3d] shadow-lg rounded-xl">
                  <DropdownMenuItem
                    onClick={() => setUserFormRole('STUDENT')}
                    className={`text-xs py-2 px-2.5 rounded-lg cursor-pointer flex items-center justify-between ${
                      userFormRole === 'STUDENT'
                        ? 'bg-[#f0f5ff] text-[#4070d8] font-bold dark:bg-blue-950 dark:text-blue-300'
                        : 'text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    <span>STUDENT (Workstation Reservation &amp; Check-In)</span>
                    {userFormRole === 'STUDENT' && <Check className="w-3.5 h-3.5 text-[#4a7cf6]" />}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setUserFormRole('ADMINISTRATOR')}
                    className={`text-xs py-2 px-2.5 rounded-lg cursor-pointer flex items-center justify-between ${
                      userFormRole === 'ADMINISTRATOR'
                        ? 'bg-[#f0f5ff] text-[#4070d8] font-bold dark:bg-blue-950 dark:text-blue-300'
                        : 'text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    <span>ADMINISTRATOR (Full Console Access &amp; CRUD)</span>
                    {userFormRole === 'ADMINISTRATOR' && <Check className="w-3.5 h-3.5 text-[#4a7cf6]" />}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsAddUserOpen(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="text-xs font-bold bg-[#4a7cf6] text-white hover:bg-[#3d6fe8] rounded-xl shadow-sm shadow-[#4a7cf6]/20"
              >
                Create User
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* -------------------------------------------------------------------- */}
      {/* MODAL 2: EDIT USER & ROLE MODAL                                      */}
      {/* -------------------------------------------------------------------- */}
      <Dialog open={isEditUserOpen} onOpenChange={setIsEditUserOpen}>
        <DialogContent className="sm:max-w-[440px] p-6 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground">
              Edit User &amp; Role Access
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Update credentials, full name, or elevate to Staff Administrator.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdateUserSubmit} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground">Student ID / Username</Label>
              <Input
                value={selectedUser?.username || ''}
                disabled
                className="text-xs font-mono bg-muted/40 cursor-not-allowed"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Full Name *</Label>
              <Input
                value={userFormFullName}
                onChange={(e) => setUserFormFullName(e.target.value)}
                className="text-xs"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Email Address</Label>
              <Input
                type="email"
                value={userFormEmail}
                onChange={(e) => setUserFormEmail(e.target.value)}
                className="text-xs"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">System Role (Permission Level) *</Label>
              <DropdownMenu>
                <DropdownMenuTrigger className="w-full h-9 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-semibold text-slate-700 dark:text-slate-200 flex items-center justify-between gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-2xs outline-none cursor-pointer">
                  <span>
                    {userFormRole === 'ADMINISTRATOR'
                      ? 'ADMINISTRATOR (Full Staff Privileges)'
                      : 'STUDENT (Standard User)'}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-[calc(100vw-2rem)] max-w-[390px] p-1 z-50 bg-white dark:bg-[#161c26] border-[#edf1f7] dark:border-[#232c3d] shadow-lg rounded-xl">
                  <DropdownMenuItem
                    onClick={() => setUserFormRole('STUDENT')}
                    className={`text-xs py-2 px-2.5 rounded-lg cursor-pointer flex items-center justify-between ${
                      userFormRole === 'STUDENT'
                        ? 'bg-[#f0f5ff] text-[#4070d8] font-bold dark:bg-blue-950 dark:text-blue-300'
                        : 'text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    <span>STUDENT (Standard User)</span>
                    {userFormRole === 'STUDENT' && <Check className="w-3.5 h-3.5 text-[#4a7cf6]" />}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setUserFormRole('ADMINISTRATOR')}
                    className={`text-xs py-2 px-2.5 rounded-lg cursor-pointer flex items-center justify-between ${
                      userFormRole === 'ADMINISTRATOR'
                        ? 'bg-[#f0f5ff] text-[#4070d8] font-bold dark:bg-blue-950 dark:text-blue-300'
                        : 'text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    <span>ADMINISTRATOR (Full Staff Privileges)</span>
                    {userFormRole === 'ADMINISTRATOR' && <Check className="w-3.5 h-3.5 text-[#4a7cf6]" />}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Reset Password (Leave blank to keep unchanged)</Label>
              <Input
                type="text"
                placeholder="New password (optional)"
                value={userFormPassword}
                onChange={(e) => setUserFormPassword(e.target.value)}
                className="text-xs font-mono"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsEditUserOpen(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="text-xs font-bold bg-[#4a7cf6] text-white hover:bg-[#3d6fe8] rounded-xl shadow-sm shadow-[#4a7cf6]/20"
              >
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* -------------------------------------------------------------------- */}
      {/* MODAL 2B: CREATE WORKSPACE DIALOG                                    */}
      {/* -------------------------------------------------------------------- */}
      <Dialog open={isAddWorkspaceOpen} onOpenChange={setIsAddWorkspaceOpen}>
        <DialogContent className="sm:max-w-[420px] p-6 rounded-2xl bg-white dark:bg-[#161c26] border-slate-200 dark:border-slate-800 shadow-xl">
          <DialogHeader>
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-[#4a7cf6] flex items-center justify-center mb-1">
              <Layers className="w-5 h-5" />
            </div>
            <DialogTitle className="text-base font-extrabold text-foreground">
              Create New Workspace / Station
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Define a new workspace area (e.g. Station F or Group table 6) before adding seats to it.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateWorkspaceSubmit} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Workspace Name *</Label>
              <Input
                placeholder="e.g. Station F or Group table 6"
                value={workspaceFormName}
                onChange={(e) => setWorkspaceFormName(e.target.value)}
                className="text-xs"
                required
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Workspace Category</Label>
              <DropdownMenu>
                <DropdownMenuTrigger className="w-full h-9 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-semibold text-slate-700 dark:text-slate-200 flex items-center justify-between gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-2xs outline-none cursor-pointer">
                  <span>
                    {workspaceFormType === 'GROUP'
                      ? 'GROUP (Shared Group Table)'
                      : 'INDIVIDUAL (Single Student Desks)'}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-[calc(100vw-2rem)] max-w-[370px] p-1 z-50 bg-white dark:bg-[#161c26] border-[#edf1f7] dark:border-[#232c3d] shadow-lg rounded-xl">
                  <DropdownMenuItem
                    onClick={() => setWorkspaceFormType('INDIVIDUAL')}
                    className={`text-xs py-2 px-2.5 rounded-lg cursor-pointer flex items-center justify-between ${
                      workspaceFormType === 'INDIVIDUAL'
                        ? 'bg-[#f0f5ff] text-[#4070d8] font-bold dark:bg-blue-950 dark:text-blue-300'
                        : 'text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    <span>INDIVIDUAL (Single Student Desks)</span>
                    {workspaceFormType === 'INDIVIDUAL' && <Check className="w-3.5 h-3.5 text-[#4a7cf6]" />}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setWorkspaceFormType('GROUP')}
                    className={`text-xs py-2 px-2.5 rounded-lg cursor-pointer flex items-center justify-between ${
                      workspaceFormType === 'GROUP'
                        ? 'bg-[#f0f5ff] text-[#4070d8] font-bold dark:bg-blue-950 dark:text-blue-300'
                        : 'text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    <span>GROUP (Shared Group Table)</span>
                    {workspaceFormType === 'GROUP' && <Check className="w-3.5 h-3.5 text-[#4a7cf6]" />}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {workspaceFormType === 'GROUP' && (
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Group Table ID (1-10)</Label>
                <Input
                  type="number"
                  placeholder="e.g. 6"
                  value={workspaceFormGroupTableId || ''}
                  onChange={(e) => setWorkspaceFormGroupTableId(Number(e.target.value))}
                  className="text-xs font-mono"
                />
              </div>
            )}

            <DialogFooter className="pt-2 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsAddWorkspaceOpen(false)}
                className="text-xs h-8 cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="text-xs font-bold bg-[#4a7cf6] text-white hover:bg-[#3d6fe8] rounded-xl shadow-sm shadow-[#4a7cf6]/20 h-8 cursor-pointer"
              >
                Create Workspace
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* -------------------------------------------------------------------- */}
      {/* MODAL 3: ADD WORKSTATION MODAL                                       */}
      {/* -------------------------------------------------------------------- */}
      <Dialog open={isAddSeatOpen} onOpenChange={setIsAddSeatOpen}>
        <DialogContent className="sm:max-w-[420px] p-6 rounded-2xl bg-white dark:bg-[#161c26] border-slate-200 dark:border-slate-800 shadow-xl">
          <DialogHeader>
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-[#4a7cf6] flex items-center justify-center mb-1">
              <Plus className="w-5 h-5" />
            </div>
            <DialogTitle className="text-base font-extrabold text-foreground">
              Add Seat to Workspace
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Select the target workspace from the dropdown to automatically configure seat properties.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateSeatSubmit} className="space-y-4 py-2">
            {/* Target Workspace Dropdown Box */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">Workspace / Table Pod *</Label>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddSeatOpen(false);
                    handleOpenAddWorkspace();
                  }}
                  className="text-[11px] font-bold text-[#4a7cf6] dark:text-blue-400 hover:underline cursor-pointer"
                >
                  + Create Workspace
                </button>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger className="w-full h-10 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-semibold text-slate-700 dark:text-slate-200 flex items-center justify-between gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-2xs outline-none cursor-pointer">
                  <div className="flex items-center gap-2 truncate">
                    <span className="w-2 h-2 rounded-full bg-[#4a7cf6] shrink-0" />
                    <span className="font-bold text-slate-800 dark:text-slate-100">{seatFormPod || 'Select Workspace'}</span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      · {seatFormType === 'GROUP' ? 'Group Table' : 'Individual Station'}
                    </span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-[calc(100vw-2rem)] max-w-[370px] max-h-72 overflow-y-auto p-1.5 z-50 bg-white dark:bg-[#161c26] border-[#edf1f7] dark:border-[#232c3d] shadow-xl rounded-xl">
                  <DropdownMenuLabel className="text-[10px] uppercase font-bold text-slate-400 px-2 py-1">
                    Individual Stations
                  </DropdownMenuLabel>
                  {availableWorkspaces
                    .filter((w) => w.type === 'INDIVIDUAL')
                    .map((w) => (
                      <DropdownMenuItem
                        key={w.name}
                        onClick={() => handleSelectWorkspaceInForm(w.name)}
                        className={`text-xs py-2 px-2.5 rounded-lg cursor-pointer flex items-center justify-between ${
                          seatFormPod.toLowerCase() === w.name.toLowerCase()
                            ? 'bg-[#f0f5ff] text-[#4070d8] font-bold dark:bg-blue-950 dark:text-blue-300'
                            : 'text-slate-700 dark:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{w.name}</span>
                          {w.seatCount !== undefined && (
                            <span className="text-[10px] text-slate-400">({w.seatCount} desks)</span>
                          )}
                        </div>
                        {seatFormPod.toLowerCase() === w.name.toLowerCase() && (
                          <Check className="w-3.5 h-3.5 text-[#4a7cf6]" />
                        )}
                      </DropdownMenuItem>
                    ))}

                  <DropdownMenuSeparator className="my-1 border-slate-100 dark:border-slate-800" />

                  <DropdownMenuLabel className="text-[10px] uppercase font-bold text-slate-400 px-2 py-1">
                    Group Tables
                  </DropdownMenuLabel>
                  {availableWorkspaces
                    .filter((w) => w.type === 'GROUP')
                    .map((w) => (
                      <DropdownMenuItem
                        key={w.name}
                        onClick={() => handleSelectWorkspaceInForm(w.name)}
                        className={`text-xs py-2 px-2.5 rounded-lg cursor-pointer flex items-center justify-between ${
                          seatFormPod.toLowerCase() === w.name.toLowerCase()
                            ? 'bg-[#f0f5ff] text-[#4070d8] font-bold dark:bg-blue-950 dark:text-blue-300'
                            : 'text-slate-700 dark:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{w.name}</span>
                          {w.seatCount !== undefined && (
                            <span className="text-[10px] text-slate-400">({w.seatCount} desks)</span>
                          )}
                        </div>
                        {seatFormPod.toLowerCase() === w.name.toLowerCase() && (
                          <Check className="w-3.5 h-3.5 text-[#4a7cf6]" />
                        )}
                      </DropdownMenuItem>
                    ))}

                  <DropdownMenuSeparator className="my-1 border-slate-100 dark:border-slate-800" />

                  <DropdownMenuItem
                    onClick={() => {
                      setIsAddSeatOpen(false);
                      handleOpenAddWorkspace();
                    }}
                    className="text-xs py-2 px-2.5 font-bold text-[#4a7cf6] dark:text-blue-400 cursor-pointer flex items-center gap-2 hover:bg-[#f0f5ff] dark:hover:bg-blue-950/40 rounded-lg"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Create New Workspace...</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Seat Code with Auto-suggestion note */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">Seat Code *</Label>
                <span className="text-[10px] text-muted-foreground font-mono">
                  Auto-suggested for {seatFormPod}
                </span>
              </div>
              <Input
                placeholder="e.g. A8 or GT1-5"
                value={seatFormCode}
                onChange={(e) => setSeatFormCode(e.target.value)}
                className="text-xs font-mono font-bold"
                required
              />
            </div>

            {/* Workspace Type Info Box */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Workspace Type:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {seatFormType === 'GROUP'
                  ? `Group Table (ID: ${seatFormGroupTableId || 1})`
                  : 'Individual Station'}
              </span>
            </div>

            {/* Status Dropdown */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Initial Status</Label>
              <DropdownMenu>
                <DropdownMenuTrigger className="w-full h-9 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-semibold text-slate-700 dark:text-slate-200 flex items-center justify-between gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-2xs outline-none cursor-pointer">
                  <span>{seatFormStatus}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-[calc(100vw-2rem)] max-w-[370px] p-1 z-50 bg-white dark:bg-[#161c26] border-[#edf1f7] dark:border-[#232c3d] shadow-lg rounded-xl">
                  {['AVAILABLE', 'MAINTENANCE', 'OCCUPIED', 'RESERVED'].map((st) => (
                    <DropdownMenuItem
                      key={st}
                      onClick={() => setSeatFormStatus(st)}
                      className={`text-xs py-2 px-2.5 rounded-lg cursor-pointer flex items-center justify-between ${
                        seatFormStatus === st
                          ? 'bg-[#f0f5ff] text-[#4070d8] font-bold dark:bg-blue-950 dark:text-blue-300'
                          : 'text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      <span>{st}</span>
                      {seatFormStatus === st && <Check className="w-3.5 h-3.5 text-[#4a7cf6]" />}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsAddSeatOpen(false)}
                className="text-xs h-8 cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="text-xs font-bold bg-[#4a7cf6] text-white hover:bg-[#3d6fe8] rounded-xl shadow-sm shadow-[#4a7cf6]/20 h-8 cursor-pointer"
              >
                Add Seat to {seatFormPod}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* -------------------------------------------------------------------- */}
      {/* MODAL 4: EDIT WORKSTATION MODAL                                      */}
      {/* -------------------------------------------------------------------- */}
      <Dialog open={isEditSeatOpen} onOpenChange={setIsEditSeatOpen}>
        <DialogContent className="sm:max-w-[420px] p-6 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground">
              Edit Workstation {selectedSeat?.seatCode}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Modify workstation metadata or station grouping.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdateSeatSubmit} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Seat Code *</Label>
              <Input
                value={seatFormCode}
                onChange={(e) => setSeatFormCode(e.target.value)}
                className="text-xs font-mono"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Workspace / Table Pod *</Label>
              <DropdownMenu>
                <DropdownMenuTrigger className="w-full h-10 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-semibold text-slate-700 dark:text-slate-200 flex items-center justify-between gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-2xs outline-none cursor-pointer">
                  <div className="flex items-center gap-2 truncate">
                    <span className="w-2 h-2 rounded-full bg-[#4a7cf6] shrink-0" />
                    <span className="font-bold text-slate-800 dark:text-slate-100">{seatFormPod || 'Select Workspace'}</span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      · {seatFormType === 'GROUP' ? 'Group Table' : 'Individual Station'}
                    </span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-[calc(100vw-2rem)] max-w-[370px] max-h-72 overflow-y-auto p-1.5 z-50 bg-white dark:bg-[#161c26] border-[#edf1f7] dark:border-[#232c3d] shadow-xl rounded-xl">
                  <DropdownMenuLabel className="text-[10px] uppercase font-bold text-slate-400 px-2 py-1">
                    Individual Stations
                  </DropdownMenuLabel>
                  {availableWorkspaces
                    .filter((w) => w.type === 'INDIVIDUAL')
                    .map((w) => (
                      <DropdownMenuItem
                        key={w.name}
                        onClick={() => {
                          setSeatFormPod(w.name);
                          setSeatFormType(w.type);
                          setSeatFormGroupTableId(w.groupTableId);
                        }}
                        className={`text-xs py-2 px-2.5 rounded-lg cursor-pointer flex items-center justify-between ${
                          seatFormPod.toLowerCase() === w.name.toLowerCase()
                            ? 'bg-[#f0f5ff] text-[#4070d8] font-bold dark:bg-blue-950 dark:text-blue-300'
                            : 'text-slate-700 dark:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{w.name}</span>
                          {w.seatCount !== undefined && (
                            <span className="text-[10px] text-slate-400">({w.seatCount} desks)</span>
                          )}
                        </div>
                        {seatFormPod.toLowerCase() === w.name.toLowerCase() && (
                          <Check className="w-3.5 h-3.5 text-[#4a7cf6]" />
                        )}
                      </DropdownMenuItem>
                    ))}

                  <DropdownMenuSeparator className="my-1 border-slate-100 dark:border-slate-800" />

                  <DropdownMenuLabel className="text-[10px] uppercase font-bold text-slate-400 px-2 py-1">
                    Group Tables
                  </DropdownMenuLabel>
                  {availableWorkspaces
                    .filter((w) => w.type === 'GROUP')
                    .map((w) => (
                      <DropdownMenuItem
                        key={w.name}
                        onClick={() => {
                          setSeatFormPod(w.name);
                          setSeatFormType(w.type);
                          setSeatFormGroupTableId(w.groupTableId);
                        }}
                        className={`text-xs py-2 px-2.5 rounded-lg cursor-pointer flex items-center justify-between ${
                          seatFormPod.toLowerCase() === w.name.toLowerCase()
                            ? 'bg-[#f0f5ff] text-[#4070d8] font-bold dark:bg-blue-950 dark:text-blue-300'
                            : 'text-slate-700 dark:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{w.name}</span>
                          {w.seatCount !== undefined && (
                            <span className="text-[10px] text-slate-400">({w.seatCount} desks)</span>
                          )}
                        </div>
                        {seatFormPod.toLowerCase() === w.name.toLowerCase() && (
                          <Check className="w-3.5 h-3.5 text-[#4a7cf6]" />
                        )}
                      </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Table Type</Label>
              <DropdownMenu>
                <DropdownMenuTrigger className="w-full h-9 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-semibold text-slate-700 dark:text-slate-200 flex items-center justify-between gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-2xs outline-none cursor-pointer">
                  <span>
                    {seatFormType === 'GROUP'
                      ? 'GROUP (Shared Group Table)'
                      : 'INDIVIDUAL (Single Student Desk)'}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-[calc(100vw-2rem)] max-w-[370px] p-1 z-50 bg-white dark:bg-[#161c26] border-[#edf1f7] dark:border-[#232c3d] shadow-lg rounded-xl">
                  <DropdownMenuItem
                    onClick={() => setSeatFormType('INDIVIDUAL')}
                    className={`text-xs py-2 px-2.5 rounded-lg cursor-pointer flex items-center justify-between ${
                      seatFormType === 'INDIVIDUAL'
                        ? 'bg-[#f0f5ff] text-[#4070d8] font-bold dark:bg-blue-950 dark:text-blue-300'
                        : 'text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    <span>INDIVIDUAL (Single Student Desk)</span>
                    {seatFormType === 'INDIVIDUAL' && <Check className="w-3.5 h-3.5 text-[#4a7cf6]" />}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setSeatFormType('GROUP')}
                    className={`text-xs py-2 px-2.5 rounded-lg cursor-pointer flex items-center justify-between ${
                      seatFormType === 'GROUP'
                        ? 'bg-[#f0f5ff] text-[#4070d8] font-bold dark:bg-blue-950 dark:text-blue-300'
                        : 'text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    <span>GROUP (Shared Group Table)</span>
                    {seatFormType === 'GROUP' && <Check className="w-3.5 h-3.5 text-[#4a7cf6]" />}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {seatFormType === 'GROUP' && (
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Group Table ID (1-10)</Label>
                <Input
                  type="number"
                  placeholder="e.g. 1"
                  value={seatFormGroupTableId || ''}
                  onChange={(e) => setSeatFormGroupTableId(Number(e.target.value))}
                  className="text-xs font-mono"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Status</Label>
              <DropdownMenu>
                <DropdownMenuTrigger className="w-full h-9 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-semibold text-slate-700 dark:text-slate-200 flex items-center justify-between gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-2xs outline-none cursor-pointer">
                  <span>
                    {seatFormStatus === 'AVAILABLE'
                      ? 'AVAILABLE'
                      : seatFormStatus === 'MAINTENANCE'
                      ? 'MAINTENANCE'
                      : seatFormStatus === 'OCCUPIED'
                      ? 'OCCUPIED'
                      : 'RESERVED'}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-[calc(100vw-2rem)] max-w-[370px] p-1 z-50 bg-white dark:bg-[#161c26] border-[#edf1f7] dark:border-[#232c3d] shadow-lg rounded-xl">
                  {[
                    { value: 'AVAILABLE', label: 'AVAILABLE' },
                    { value: 'MAINTENANCE', label: 'MAINTENANCE' },
                    { value: 'OCCUPIED', label: 'OCCUPIED' },
                    { value: 'RESERVED', label: 'RESERVED' },
                  ].map((item) => (
                    <DropdownMenuItem
                      key={item.value}
                      onClick={() => setSeatFormStatus(item.value)}
                      className={`text-xs py-2 px-2.5 rounded-lg cursor-pointer flex items-center justify-between ${
                        seatFormStatus === item.value
                          ? 'bg-[#f0f5ff] text-[#4070d8] font-bold dark:bg-blue-950 dark:text-blue-300'
                          : 'text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      <span>{item.label}</span>
                      {seatFormStatus === item.value && <Check className="w-3.5 h-3.5 text-[#4a7cf6]" />}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <DialogFooter className="pt-2 flex flex-row items-center justify-between sm:justify-between w-full">
              {selectedSeat && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsEditSeatOpen(false);
                    handleDeleteSeat(selectedSeat);
                  }}
                  className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 px-2.5 h-8 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1" />
                  Delete Workstation
                </Button>
              )}
              <div className="flex items-center gap-2 ml-auto">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditSeatOpen(false)}
                  className="text-xs h-8 cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="text-xs font-bold bg-[#4a7cf6] text-white hover:bg-[#3d6fe8] rounded-xl shadow-sm shadow-[#4a7cf6]/20 h-8 cursor-pointer"
                >
                  Save Workstation
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* -------------------------------------------------------------------- */}
      {/* MODAL 5: TERMINATE SESSION DIALOG                                    */}
      {/* -------------------------------------------------------------------- */}
      <Dialog open={!!terminatingSessionId} onOpenChange={(open) => !open && setTerminatingSessionId(null)}>
        <DialogContent className="sm:max-w-[420px] p-6 rounded-2xl">
          <DialogHeader>
            <div className="w-12 h-12 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center mb-2">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <DialogTitle className="text-base font-bold text-foreground">
              Terminate Active Session?
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-1.5">
              This will immediately revoke the student&apos;s session #{terminatingSessionId} and free the workstation for other users.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2">
            <Label className="text-xs font-semibold">Administrative Reason</Label>
            <Input
              value={terminateReason}
              onChange={(e) => setTerminateReason(e.target.value)}
              className="text-xs"
            />
          </div>

          <DialogFooter className="mt-4 flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTerminatingSessionId(null)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleConfirmTerminate}
              className="text-xs font-bold"
            >
              Confirm Termination
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* -------------------------------------------------------------------- */}
      {/* MODAL 6: DESK QR STICKERS PRINT MODAL                                */}
      {/* -------------------------------------------------------------------- */}
      <Dialog open={isQrModalOpen} onOpenChange={setIsQrModalOpen}>
        <DialogContent className="sm:max-w-[650px] max-h-[85vh] p-6 rounded-2xl flex flex-col">
          <DialogHeader className="shrink-0 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-lg font-bold text-foreground">
                  Desk QR Code Stickers
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  High-resolution QR code tokens for physical placement on lab desks.
                </DialogDescription>
              </div>
              <Button
                size="sm"
                onClick={() => window.print()}
                className="gap-2 text-xs font-bold bg-[#4a7cf6] text-white hover:bg-[#3d6fe8] rounded-xl shadow-sm shadow-[#4a7cf6]/20 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print All ({generatedQrs.length})</span>
              </Button>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto py-4">
            {generatingQrs ? (
              <div className="py-12 text-center text-xs text-muted-foreground">
                Generating high-resolution QR tokens...
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {generatedQrs.map(({ seat, dataUrl }) => (
                  <div
                    key={seat.id}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-card text-center space-y-2.5 shadow-3xs flex flex-col justify-between"
                  >
                    <div className="space-y-1.5">
                      <div className="font-extrabold text-sm text-foreground">
                        {seat.seatCode}
                      </div>
                      <div className="text-[10px] text-muted-foreground font-medium">
                        {seat.podLabel}
                      </div>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={dataUrl}
                        alt={seat.seatCode}
                        className="w-32 h-32 mx-auto rounded-lg border border-slate-100 dark:border-slate-800"
                      />
                      <div className="font-mono text-[9px] text-slate-400 truncate">
                        {seat.qrToken}
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadQr(seat, dataUrl)}
                      className="w-full h-8 text-[11px] font-semibold gap-1.5 rounded-xl border-slate-200 dark:border-slate-700 hover:bg-[#4a7cf6]/10 hover:text-[#4a7cf6] hover:border-[#4a7cf6]/30 transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download QR</span>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter className="shrink-0 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsQrModalOpen(false)}
              className="text-xs"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* -------------------------------------------------------------------- */}
      {/* MODAL 7: DELETE CONFIRMATION POP UP CARD                             */}
      {/* -------------------------------------------------------------------- */}
      <Dialog
        open={deleteConfirmState.isOpen}
        onOpenChange={(open) => {
          if (!open && !isDeleting) {
            setDeleteConfirmState((prev) => ({ ...prev, isOpen: false }));
          }
        }}
      >
        <DialogContent className="sm:max-w-[420px] p-6 rounded-2xl bg-white dark:bg-[#161c26] border-slate-200 dark:border-slate-800 shadow-xl">
          <DialogHeader>
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-2">
              <Trash2 className="w-6 h-6 stroke-[2]" />
            </div>
            <DialogTitle className="text-base font-extrabold text-foreground">
              {deleteConfirmState.title}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
              {deleteConfirmState.description}
            </DialogDescription>
          </DialogHeader>

          {deleteConfirmState.itemLabel && (
            <div className="p-3 my-1 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center gap-2.5">
              <div className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                {deleteConfirmState.itemLabel}
              </span>
            </div>
          )}

          <DialogFooter className="mt-4 flex flex-row items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isDeleting}
              onClick={() => setDeleteConfirmState((prev) => ({ ...prev, isOpen: false }))}
              className="text-xs h-9 px-4 rounded-xl cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={isDeleting}
              onClick={async () => {
                setIsDeleting(true);
                try {
                  await deleteConfirmState.onConfirm();
                  setDeleteConfirmState((prev) => ({ ...prev, isOpen: false }));
                } catch (err: unknown) {
                  showToast(err instanceof Error ? err.message : 'Delete failed', 'error');
                } finally {
                  setIsDeleting(false);
                }
              }}
              className="text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white h-9 px-4 rounded-xl shadow-sm shadow-rose-600/20 cursor-pointer"
            >
              {isDeleting ? 'Deleting...' : 'Yes, Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* -------------------------------------------------------------------- */}
      {/* MODAL: LAB OPERATING HOURS & TIME CONTROL SETTINGS                   */}
      {/* -------------------------------------------------------------------- */}
      <Dialog open={isTimeControlModalOpen} onOpenChange={setIsTimeControlModalOpen}>
        <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden rounded-2xl bg-white dark:bg-[#161c26] border border-[#edf1f7] dark:border-[#232c3d] shadow-xl">
          <div className="p-6 pb-5 bg-gradient-to-br from-[#f0f5ff] via-white to-[#f8fafc] dark:from-blue-950/40 dark:via-[#161c26] dark:to-[#131923] border-b border-[#edf1f7] dark:border-[#232c3d]">
            <DialogHeader className="text-left">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-[#4a7cf6] text-white flex items-center justify-center font-bold shadow-xs">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <DialogTitle className="text-base font-extrabold text-foreground">
                    Workstation Time Control &amp; Schedule
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground">
                    Operating window parameters governing student workstation reservations and check-ins.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-2.5 mt-3">
              <div className="p-3 rounded-xl bg-white/90 dark:bg-slate-900/60 border border-[#edf1f7] dark:border-[#232c3d]">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Current Status</div>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className={`w-2 h-2 rounded-full ${labStatus.isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                  <span className={`text-xs font-bold ${labStatus.isOpen ? 'text-emerald-700 dark:text-emerald-300' : 'text-amber-700 dark:text-amber-300'}`}>
                    {labStatus.isOpen ? 'OPEN FOR USE' : 'CLOSED / AFTER HOURS'}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white/90 dark:bg-slate-900/60 border border-[#edf1f7] dark:border-[#232c3d]">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Time Zone</div>
                <div className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 mt-1 truncate">
                  {LAB_TIMEZONE} (UTC+7)
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-4 text-xs">
            {/* Schedule Specifications */}
            <div className="space-y-2">
              <span className="font-extrabold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
                Enforced Operating Schedule
              </span>
              <div className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Configured Daily Hours:</span>
                  <span className="font-mono font-extrabold text-slate-800 dark:text-white">
                    {formatLabHoursRange(labConfig.openHour, labConfig.closeHour)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Workstation Reservation Access:</span>
                  <span className={`font-mono font-bold ${labConfig.workstationsEnabled ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                    {labConfig.workstationsEnabled ? 'ALLOWED (Active)' : 'DISABLED (Locked)'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Auto-Session Termination:</span>
                  <span className="font-mono font-semibold text-slate-800 dark:text-white">
                    {formatLabHour(labConfig.closeHour)} (Closing Deadline)
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Reservation Check-in Grace:</span>
                  <span className="font-mono font-semibold text-slate-800 dark:text-white">
                    20 Minutes After Start
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Live Clock (Bangkok):</span>
                  <span className="font-mono font-bold text-[#4a7cf6] dark:text-blue-400">
                    {labStatus.timeString}
                  </span>
                </div>
              </div>
            </div>

            {/* Client Enforcement Note */}
            <div className="p-3.5 rounded-xl border border-blue-100 dark:border-blue-900/40 bg-blue-50/70 dark:bg-blue-950/20 text-slate-600 dark:text-slate-300 space-y-1.5 leading-relaxed">
              <div className="flex items-center gap-1.5 font-bold text-[#4070d8] dark:text-blue-300">
                <CheckCircle2 className="w-4 h-4" />
                <span>Adjustable Time Control Policy</span>
              </div>
              <p className="text-[11px]">
                Admins can dynamically adjust operating hours using the stepper controls above or toggle workstation availability directly. Client reservations and check-ins strictly conform to these configured parameters in real-time.
              </p>
            </div>

            <DialogFooter className="pt-2 flex items-center justify-between sm:justify-between w-full">
              <span className="text-[11px] text-slate-400">
                Staff Administrator Control
              </span>
              <Button
                type="button"
                size="sm"
                onClick={() => setIsTimeControlModalOpen(false)}
                className="text-xs font-bold bg-[#4a7cf6] text-white hover:bg-[#3d6fe8] rounded-xl px-4 cursor-pointer"
              >
                Close
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
