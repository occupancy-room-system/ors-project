export type SeatStatus = 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'EXPIRING_SOON' | 'MAINTENANCE';

export type UserRole = 'STUDENT' | 'ADMINISTRATOR';

export interface User {
  id: number;
  fullName: string;
  email: string;
  role: UserRole;
  accountStatus: 'ACTIVE' | 'SUSPENDED';
}

export interface Reservation {
  id: number;
  userId: number;
  userName: string;
  userEmail: string;
  seatId: number;
  seatCode: string;
  podLabel: string;
  startTime: string; // ISO String
  durationHours: number; // 1 to 4 hours
  expiresAt: string;
  status: 'PENDING_ACTIVATION' | 'ACTIVATED' | 'CANCELLED' | 'EXPIRED';
  createdAt: string;
  isGroupReservation?: boolean;
  groupTableId?: number;
  groupTableName?: string;
  totalSeatsReserved?: number;
}

export interface Room {
  id: number;
  roomCode: string;
  name: string;
  description: string;
  building: string;
  floorLevel: number;
  widthUnits: number;
  heightUnits: number;
  status: 'ACTIVE' | 'MAINTENANCE';
}

export interface Seat {
  id: number;
  roomId: number;
  seatCode: string;
  xPosition: number;
  yPosition: number;
  podLabel: string;
  status: SeatStatus;
  qrToken: string;
  tableType?: 'INDIVIDUAL' | 'GROUP';
  groupTableId?: number;
  groupTableName?: string;
  groupCapacity?: number;
  currentSession?: {
    sessionId: number;
    userName?: string;
    checkedInAt: string;
    expiresAt: string;
    minutesRemaining: number;
  };
  currentReservation?: Reservation;
}

export interface OccupancyMapResponse {
  room: Room;
  seats: Seat[];
  totalSeats: number;
  availableSeats: number;
  occupiedSeats: number;
  reservedSeats: number;
  occupancyPercentage: number;
  lastUpdated: string;
}

export interface OccupancySession {
  id: number;
  userId: number;
  seatId: number;
  seatCode: string;
  podLabel: string;
  roomName: string;
  checkedInAt: string;
  expiresAt: string;
  checkedOutAt?: string;
  status: 'ACTIVE' | 'CHECKED_OUT' | 'EXPIRED' | 'FORCE_TERMINATED';
  durationMinutes: number;
  minutesRemaining?: number;
}

export interface AnalyticsData {
  hourlyOccupancy: { hour: string; occupancyCount: number; rate: number }[];
  podUtilization: { pod: string; totalSeats: number; occupied: number; rate: number }[];
  sessionStats: {
    totalSessionsToday: number;
    avgSessionMinutes: number;
    expiredWithoutCheckout: number;
    normalCheckouts: number;
  };
}

export interface HealthStatus {
  service: string;
  status: string;
  framework: string;
  databaseTargetPort: number;
  databaseConnected: boolean;
  activeSessions: number;
  totalSeats: number;
}

export type UsageInterval = 'daily' | 'weekly' | 'monthly';

export interface UsageBucket {
  periodLabel: string;
  dateKey: string;
  userCount: number;
  totalMinutes: number;
  totalHours: number;
  sessionCount: number;
}

export interface UserUsageRanking {
  userId: number;
  userName: string;
  userEmail: string;
  totalMinutes: number;
  totalHours: number;
  sessionCount: number;
}

export interface UsageDashboardData {
  summary: {
    totalUsers: number;
    totalUsageMinutes: number;
    totalUsageHours: number;
    totalSessions: number;
    avgSessionMinutes: number;
    avgUserMinutes: number;
  };
  timeline: UsageBucket[];
  topUsers: UserUsageRanking[];
  interval: UsageInterval;
  startDate: string;
  endDate: string;
}

