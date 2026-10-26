import { env } from './env';

export const APP_CONSTANTS = {
  COOKIE_NAME: 'eliteride_session',
  COOKIE_MAX_AGE: 24 * 60 * 60 * 1000, // 24 hours
  CUSTOMER_COOKIE_NAME: 'eliteride_customer_session',
  CUSTOMER_COOKIE_MAX_AGE: 7 * 24 * 60 * 60 * 1000, // 7 days
  DEFAULT_TIMEZONE: 'Asia/Kolkata',
  DEFAULT_BUFFER_MINUTES: 60,
  OTP_EXPIRY_MINUTES: 10,
  REFERENCE_PREFIX: 'CR',
};

export const getCookieOptions = () => ({
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: APP_CONSTANTS.COOKIE_MAX_AGE,
  path: '/',
});

export const getCustomerCookieOptions = () => ({
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: APP_CONSTANTS.CUSTOMER_COOKIE_MAX_AGE,
  path: '/',
});

