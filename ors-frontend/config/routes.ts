export const ROUTES = {
  HOME: '/',
  CHECKIN: '/checkin',
  SESSION: '/session',
  ADMIN: '/admin',
  LOGIN: '/auth/login',
  REGISTER: '/auth/login?mode=register',
} as const;

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES];
