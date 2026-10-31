export const ROUTES = {
  HOME: '/',
  CHECKIN: '/checkin',
  SESSION: '/session',
  ADMIN: '/admin',
} as const;

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES];

