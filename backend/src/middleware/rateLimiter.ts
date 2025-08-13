import rateLimit from 'express-rate-limit';
import { ApiResponse } from '../utils/response';

export const createRateLimiter = (windowMs: number, max: number, message: string) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      message,
      timestamp: new Date().toISOString()
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
};

// General rate limiter
export const generalLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  100, // limit each IP to 100 requests per windowMs
  'Terlalu banyak request, coba lagi dalam 15 menit'
);

// Auth rate limiter
export const authLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  5, // limit each IP to 5 requests per windowMs
  'Terlalu banyak percobaan login, coba lagi dalam 15 menit'
);

// Upload rate limiter
export const uploadLimiter = createRateLimiter(
  60 * 1000, // 1 minute
  5, // limit each IP to 5 uploads per minute
  'Terlalu banyak upload file, coba lagi dalam 1 menit'
);