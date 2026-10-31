import { ROUTES } from './routes';

const config = {
  appName: 'Occupancy Room System (ORS)',
  labName: 'SE Innovation Lab 101',
  building: 'Turing Hall of Computing',
  defaultRoomId: 1,
  apiBaseUrl: process.env.NEXT_PUBLIC_API_URL || '/api/v1',
  pollingIntervalMs: 10000,
  routes: ROUTES,
};

export default config;
export * from './routes';

