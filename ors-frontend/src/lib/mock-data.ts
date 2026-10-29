import { OccupancyMapResponse, Room, Seat, HealthStatus } from '../types';

export const INITIAL_ROOM: Room = {
  id: 1,
  roomCode: 'SE-LAB-101',
  name: 'Software Engineering Innovation Lab',
  description: 'Main undergraduate collaborative engineering workspace with 54 workstations: Stations A-E (Individual) and Group Tables 1-5 (Group Booking).',
  building: 'Turing Hall of Computing',
  floorLevel: 1,
  widthUnits: 14,
  heightUnits: 10,
  status: 'ACTIVE',
};

export const INITIAL_SEATS: Seat[] = [
  // --- Station A: 6 Desks (Individual Workstations) ---
  { id: 1, roomId: 1, seatCode: 'SEAT-A1', xPosition: 2, yPosition: 2, podLabel: 'Station A', tableType: 'INDIVIDUAL', status: 'RESERVED', qrToken: 'QR-SELAB101-A1' },
  { id: 2, roomId: 1, seatCode: 'SEAT-A2', xPosition: 3, yPosition: 2, podLabel: 'Station A', tableType: 'INDIVIDUAL', status: 'AVAILABLE', qrToken: 'QR-SELAB101-A2' },
  { id: 3, roomId: 1, seatCode: 'SEAT-A3', xPosition: 4, yPosition: 2, podLabel: 'Station A', tableType: 'INDIVIDUAL', status: 'OCCUPIED', qrToken: 'QR-SELAB101-A3' },
  { id: 4, roomId: 1, seatCode: 'SEAT-A4', xPosition: 2, yPosition: 3, podLabel: 'Station A', tableType: 'INDIVIDUAL', status: 'AVAILABLE', qrToken: 'QR-SELAB101-A4' },
  { id: 5, roomId: 1, seatCode: 'SEAT-A5', xPosition: 3, yPosition: 3, podLabel: 'Station A', tableType: 'INDIVIDUAL', status: 'AVAILABLE', qrToken: 'QR-SELAB101-A5' },
  { id: 6, roomId: 1, seatCode: 'SEAT-A6', xPosition: 4, yPosition: 3, podLabel: 'Station A', tableType: 'INDIVIDUAL', status: 'AVAILABLE', qrToken: 'QR-SELAB101-A6' },

  // --- Station B: 6 Desks (Individual Workstations) ---
  { id: 7, roomId: 1, seatCode: 'SEAT-B1', xPosition: 6, yPosition: 2, podLabel: 'Station B', tableType: 'INDIVIDUAL', status: 'AVAILABLE', qrToken: 'QR-SELAB101-B1' },
  { id: 8, roomId: 1, seatCode: 'SEAT-B2', xPosition: 7, yPosition: 2, podLabel: 'Station B', tableType: 'INDIVIDUAL', status: 'AVAILABLE', qrToken: 'QR-SELAB101-B2' },
  { id: 9, roomId: 1, seatCode: 'SEAT-B3', xPosition: 8, yPosition: 2, podLabel: 'Station B', tableType: 'INDIVIDUAL', status: 'AVAILABLE', qrToken: 'QR-SELAB101-B3' },
  { id: 10, roomId: 1, seatCode: 'SEAT-B4', xPosition: 6, yPosition: 3, podLabel: 'Station B', tableType: 'INDIVIDUAL', status: 'AVAILABLE', qrToken: 'QR-SELAB101-B4' },
  { id: 11, roomId: 1, seatCode: 'SEAT-B5', xPosition: 7, yPosition: 3, podLabel: 'Station B', tableType: 'INDIVIDUAL', status: 'EXPIRING_SOON', qrToken: 'QR-SELAB101-B5' },
  { id: 12, roomId: 1, seatCode: 'SEAT-B6', xPosition: 8, yPosition: 3, podLabel: 'Station B', tableType: 'INDIVIDUAL', status: 'AVAILABLE', qrToken: 'QR-SELAB101-B6' },

  // --- Group Table 1: 2 Desks ---
  { id: 13, roomId: 1, seatCode: 'SEAT-GT1-1', xPosition: 10, yPosition: 2, podLabel: 'Group Table 1', tableType: 'GROUP', groupTableId: 1, groupTableName: 'Group Table 1', groupCapacity: 2, status: 'AVAILABLE', qrToken: 'QR-SELAB101-GT1-1' },
  { id: 14, roomId: 1, seatCode: 'SEAT-GT1-2', xPosition: 10, yPosition: 3, podLabel: 'Group Table 1', tableType: 'GROUP', groupTableId: 1, groupTableName: 'Group Table 1', groupCapacity: 2, status: 'AVAILABLE', qrToken: 'QR-SELAB101-GT1-2' },

  // --- Group Table 2: 9 Desks ---
  { id: 15, roomId: 1, seatCode: 'SEAT-GT2-1', xPosition: 12, yPosition: 1, podLabel: 'Group Table 2', tableType: 'GROUP', groupTableId: 2, groupTableName: 'Group Table 2', groupCapacity: 9, status: 'AVAILABLE', qrToken: 'QR-SELAB101-GT2-1' },
  { id: 16, roomId: 1, seatCode: 'SEAT-GT2-2', xPosition: 13, yPosition: 1, podLabel: 'Group Table 2', tableType: 'GROUP', groupTableId: 2, groupTableName: 'Group Table 2', groupCapacity: 9, status: 'AVAILABLE', qrToken: 'QR-SELAB101-GT2-2' },
  { id: 17, roomId: 1, seatCode: 'SEAT-GT2-3', xPosition: 12, yPosition: 2, podLabel: 'Group Table 2', tableType: 'GROUP', groupTableId: 2, groupTableName: 'Group Table 2', groupCapacity: 9, status: 'AVAILABLE', qrToken: 'QR-SELAB101-GT2-3' },
  { id: 18, roomId: 1, seatCode: 'SEAT-GT2-4', xPosition: 13, yPosition: 2, podLabel: 'Group Table 2', tableType: 'GROUP', groupTableId: 2, groupTableName: 'Group Table 2', groupCapacity: 9, status: 'AVAILABLE', qrToken: 'QR-SELAB101-GT2-4' },
  { id: 19, roomId: 1, seatCode: 'SEAT-GT2-5', xPosition: 12, yPosition: 3, podLabel: 'Group Table 2', tableType: 'GROUP', groupTableId: 2, groupTableName: 'Group Table 2', groupCapacity: 9, status: 'AVAILABLE', qrToken: 'QR-SELAB101-GT2-5' },
  { id: 20, roomId: 1, seatCode: 'SEAT-GT2-6', xPosition: 13, yPosition: 3, podLabel: 'Group Table 2', tableType: 'GROUP', groupTableId: 2, groupTableName: 'Group Table 2', groupCapacity: 9, status: 'AVAILABLE', qrToken: 'QR-SELAB101-GT2-6' },
  { id: 21, roomId: 1, seatCode: 'SEAT-GT2-7', xPosition: 12, yPosition: 4, podLabel: 'Group Table 2', tableType: 'GROUP', groupTableId: 2, groupTableName: 'Group Table 2', groupCapacity: 9, status: 'AVAILABLE', qrToken: 'QR-SELAB101-GT2-7' },
  { id: 22, roomId: 1, seatCode: 'SEAT-GT2-8', xPosition: 13, yPosition: 4, podLabel: 'Group Table 2', tableType: 'GROUP', groupTableId: 2, groupTableName: 'Group Table 2', groupCapacity: 9, status: 'AVAILABLE', qrToken: 'QR-SELAB101-GT2-8' },
  { id: 23, roomId: 1, seatCode: 'SEAT-GT2-9', xPosition: 12, yPosition: 5, podLabel: 'Group Table 2', tableType: 'GROUP', groupTableId: 2, groupTableName: 'Group Table 2', groupCapacity: 9, status: 'AVAILABLE', qrToken: 'QR-SELAB101-GT2-9' },

  // --- Group Table 3: 4 Desks ---
  { id: 24, roomId: 1, seatCode: 'SEAT-GT3-1', xPosition: 2, yPosition: 5, podLabel: 'Group Table 3', tableType: 'GROUP', groupTableId: 3, groupTableName: 'Group Table 3', groupCapacity: 4, status: 'AVAILABLE', qrToken: 'QR-SELAB101-GT3-1' },
  { id: 25, roomId: 1, seatCode: 'SEAT-GT3-2', xPosition: 3, yPosition: 5, podLabel: 'Group Table 3', tableType: 'GROUP', groupTableId: 3, groupTableName: 'Group Table 3', groupCapacity: 4, status: 'AVAILABLE', qrToken: 'QR-SELAB101-GT3-2' },
  { id: 26, roomId: 1, seatCode: 'SEAT-GT3-3', xPosition: 2, yPosition: 6, podLabel: 'Group Table 3', tableType: 'GROUP', groupTableId: 3, groupTableName: 'Group Table 3', groupCapacity: 4, status: 'AVAILABLE', qrToken: 'QR-SELAB101-GT3-3' },
  { id: 27, roomId: 1, seatCode: 'SEAT-GT3-4', xPosition: 3, yPosition: 6, podLabel: 'Group Table 3', tableType: 'GROUP', groupTableId: 3, groupTableName: 'Group Table 3', groupCapacity: 4, status: 'AVAILABLE', qrToken: 'QR-SELAB101-GT3-4' },

  // --- Station C: 4 Desks ---
  { id: 28, roomId: 1, seatCode: 'SEAT-C1', xPosition: 5, yPosition: 5, podLabel: 'Station C', tableType: 'INDIVIDUAL', status: 'AVAILABLE', qrToken: 'QR-SELAB101-C1' },
  { id: 29, roomId: 1, seatCode: 'SEAT-C2', xPosition: 6, yPosition: 5, podLabel: 'Station C', tableType: 'INDIVIDUAL', status: 'AVAILABLE', qrToken: 'QR-SELAB101-C2' },
  { id: 30, roomId: 1, seatCode: 'SEAT-C3', xPosition: 5, yPosition: 6, podLabel: 'Station C', tableType: 'INDIVIDUAL', status: 'AVAILABLE', qrToken: 'QR-SELAB101-C3' },
  { id: 31, roomId: 1, seatCode: 'SEAT-C4', xPosition: 6, yPosition: 6, podLabel: 'Station C', tableType: 'INDIVIDUAL', status: 'MAINTENANCE', qrToken: 'QR-SELAB101-C4' },

  // --- Station D: 2 Desks ---
  { id: 32, roomId: 1, seatCode: 'SEAT-D1', xPosition: 8, yPosition: 5, podLabel: 'Station D', tableType: 'INDIVIDUAL', status: 'AVAILABLE', qrToken: 'QR-SELAB101-D1' },
  { id: 33, roomId: 1, seatCode: 'SEAT-D2', xPosition: 8, yPosition: 6, podLabel: 'Station D', tableType: 'INDIVIDUAL', status: 'AVAILABLE', qrToken: 'QR-SELAB101-D2' },

  // --- Station E: 4 Desks ---
  { id: 34, roomId: 1, seatCode: 'SEAT-E1', xPosition: 10, yPosition: 5, podLabel: 'Station E', tableType: 'INDIVIDUAL', status: 'AVAILABLE', qrToken: 'QR-SELAB101-E1' },
  { id: 35, roomId: 1, seatCode: 'SEAT-E2', xPosition: 11, yPosition: 5, podLabel: 'Station E', tableType: 'INDIVIDUAL', status: 'AVAILABLE', qrToken: 'QR-SELAB101-E2' },
  { id: 36, roomId: 1, seatCode: 'SEAT-E3', xPosition: 10, yPosition: 6, podLabel: 'Station E', tableType: 'INDIVIDUAL', status: 'AVAILABLE', qrToken: 'QR-SELAB101-E3' },
  { id: 37, roomId: 1, seatCode: 'SEAT-E4', xPosition: 11, yPosition: 6, podLabel: 'Station E', tableType: 'INDIVIDUAL', status: 'AVAILABLE', qrToken: 'QR-SELAB101-E4' },

  // --- Group Table 5: 8 Desks ---
  { id: 38, roomId: 1, seatCode: 'SEAT-GT5-1', xPosition: 2, yPosition: 8, podLabel: 'Group Table 5', tableType: 'GROUP', groupTableId: 5, groupTableName: 'Group Table 5', groupCapacity: 8, status: 'AVAILABLE', qrToken: 'QR-SELAB101-GT5-1' },
  { id: 39, roomId: 1, seatCode: 'SEAT-GT5-2', xPosition: 3, yPosition: 8, podLabel: 'Group Table 5', tableType: 'GROUP', groupTableId: 5, groupTableName: 'Group Table 5', groupCapacity: 8, status: 'AVAILABLE', qrToken: 'QR-SELAB101-GT5-2' },
  { id: 40, roomId: 1, seatCode: 'SEAT-GT5-3', xPosition: 4, yPosition: 8, podLabel: 'Group Table 5', tableType: 'GROUP', groupTableId: 5, groupTableName: 'Group Table 5', groupCapacity: 8, status: 'AVAILABLE', qrToken: 'QR-SELAB101-GT5-3' },
  { id: 41, roomId: 1, seatCode: 'SEAT-GT5-4', xPosition: 5, yPosition: 8, podLabel: 'Group Table 5', tableType: 'GROUP', groupTableId: 5, groupTableName: 'Group Table 5', groupCapacity: 8, status: 'AVAILABLE', qrToken: 'QR-SELAB101-GT5-4' },
  { id: 42, roomId: 1, seatCode: 'SEAT-GT5-5', xPosition: 2, yPosition: 9, podLabel: 'Group Table 5', tableType: 'GROUP', groupTableId: 5, groupTableName: 'Group Table 5', groupCapacity: 8, status: 'AVAILABLE', qrToken: 'QR-SELAB101-GT5-5' },
  { id: 43, roomId: 1, seatCode: 'SEAT-GT5-6', xPosition: 3, yPosition: 9, podLabel: 'Group Table 5', tableType: 'GROUP', groupTableId: 5, groupTableName: 'Group Table 5', groupCapacity: 8, status: 'AVAILABLE', qrToken: 'QR-SELAB101-GT5-6' },
  { id: 44, roomId: 1, seatCode: 'SEAT-GT5-7', xPosition: 4, yPosition: 9, podLabel: 'Group Table 5', tableType: 'GROUP', groupTableId: 5, groupTableName: 'Group Table 5', groupCapacity: 8, status: 'AVAILABLE', qrToken: 'QR-SELAB101-GT5-7' },
  { id: 45, roomId: 1, seatCode: 'SEAT-GT5-8', xPosition: 5, yPosition: 9, podLabel: 'Group Table 5', tableType: 'GROUP', groupTableId: 5, groupTableName: 'Group Table 5', groupCapacity: 8, status: 'AVAILABLE', qrToken: 'QR-SELAB101-GT5-8' },

  // --- Group Table 4: 9 Desks ---
  { id: 46, roomId: 1, seatCode: 'SEAT-GT4-1', xPosition: 12, yPosition: 7, podLabel: 'Group Table 4', tableType: 'GROUP', groupTableId: 4, groupTableName: 'Group Table 4', groupCapacity: 9, status: 'AVAILABLE', qrToken: 'QR-SELAB101-GT4-1' },
  { id: 47, roomId: 1, seatCode: 'SEAT-GT4-2', xPosition: 13, yPosition: 7, podLabel: 'Group Table 4', tableType: 'GROUP', groupTableId: 4, groupTableName: 'Group Table 4', groupCapacity: 9, status: 'AVAILABLE', qrToken: 'QR-SELAB101-GT4-2' },
  { id: 48, roomId: 1, seatCode: 'SEAT-GT4-3', xPosition: 12, yPosition: 8, podLabel: 'Group Table 4', tableType: 'GROUP', groupTableId: 4, groupTableName: 'Group Table 4', groupCapacity: 9, status: 'AVAILABLE', qrToken: 'QR-SELAB101-GT4-3' },
  { id: 49, roomId: 1, seatCode: 'SEAT-GT4-4', xPosition: 13, yPosition: 8, podLabel: 'Group Table 4', tableType: 'GROUP', groupTableId: 4, groupTableName: 'Group Table 4', groupCapacity: 9, status: 'AVAILABLE', qrToken: 'QR-SELAB101-GT4-4' },
  { id: 50, roomId: 1, seatCode: 'SEAT-GT4-5', xPosition: 12, yPosition: 9, podLabel: 'Group Table 4', tableType: 'GROUP', groupTableId: 4, groupTableName: 'Group Table 4', groupCapacity: 9, status: 'AVAILABLE', qrToken: 'QR-SELAB101-GT4-5' },
  { id: 51, roomId: 1, seatCode: 'SEAT-GT4-6', xPosition: 13, yPosition: 9, podLabel: 'Group Table 4', tableType: 'GROUP', groupTableId: 4, groupTableName: 'Group Table 4', groupCapacity: 9, status: 'AVAILABLE', qrToken: 'QR-SELAB101-GT4-6' },
  { id: 52, roomId: 1, seatCode: 'SEAT-GT4-7', xPosition: 12, yPosition: 10, podLabel: 'Group Table 4', tableType: 'GROUP', groupTableId: 4, groupTableName: 'Group Table 4', groupCapacity: 9, status: 'AVAILABLE', qrToken: 'QR-SELAB101-GT4-7' },
  { id: 53, roomId: 1, seatCode: 'SEAT-GT4-8', xPosition: 13, yPosition: 10, podLabel: 'Group Table 4', tableType: 'GROUP', groupTableId: 4, groupTableName: 'Group Table 4', groupCapacity: 9, status: 'AVAILABLE', qrToken: 'QR-SELAB101-GT4-8' },
  { id: 54, roomId: 1, seatCode: 'SEAT-GT4-9', xPosition: 12, yPosition: 11, podLabel: 'Group Table 4', tableType: 'GROUP', groupTableId: 4, groupTableName: 'Group Table 4', groupCapacity: 9, status: 'AVAILABLE', qrToken: 'QR-SELAB101-GT4-9' }
];

export const DEFAULT_MAP_DATA: OccupancyMapResponse = {
  room: INITIAL_ROOM,
  seats: INITIAL_SEATS,
  totalSeats: 54,
  availableSeats: 48,
  occupiedSeats: 1,
  reservedSeats: 1,
  occupancyPercentage: 3.7,
  lastUpdated: new Date().toISOString()
};

export const DEFAULT_HEALTH: HealthStatus = {
  service: 'ors-server',
  status: 'UP',
  framework: 'Spring Boot 3.4.3',
  databaseTargetPort: 3307,
  databaseConnected: true,
  activeSessions: 2,
  totalSeats: 54
};
