import { ROUTES } from './routes';

const config = {
  appName: 'Occupancy Room System (ORS)',
  labName: 'SE Lab',
  building: 'SE Lab',
  defaultRoomId: 1,
  apiBaseUrl: process.env.NEXT_PUBLIC_BASE_API || 'http://localhost:8080',
  pollingIntervalMs: 10000,
  routes: ROUTES,
};

export default config;
export * from './routes';
