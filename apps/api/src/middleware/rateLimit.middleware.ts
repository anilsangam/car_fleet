import rateLimit from 'express-rate-limit';

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    error: 'Too many login attempts from this IP, please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const bookingCreateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  message: {
    success: false,
    error: 'Too many booking requests created from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const statusLookupLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  message: {
    success: false,
    error: 'Too many status check attempts, please try again in 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

