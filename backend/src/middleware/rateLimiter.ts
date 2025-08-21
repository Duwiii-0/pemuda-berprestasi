import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { HttpStatus } from '@/types';

/**
 * Rate limiter configuration options
 */
interface RateLimiterOptions {
  windowMs: number;
  max: number;
  message?: string;
  standardHeaders?: boolean;
  legacyHeaders?: boolean;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (req: Request) => string;
}

/**
 * Default rate limit configuration
 */
const defaultOptions: RateLimiterOptions = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false
};

/**
 * Create rate limiter with custom configuration
 */
const createRateLimiter = (options: Partial<RateLimiterOptions> = {}) => {
  const config = { ...defaultOptions, ...options };
  
  return rateLimit({
    windowMs: config.windowMs,
    max: config.max,
    message: {
      success: false,
      message: config.message,
      errorCode: 'RATE_LIMIT_EXCEEDED',
      timestamp: new Date().toISOString()
    },
    standardHeaders: config.standardHeaders,
    legacyHeaders: config.legacyHeaders,
    skipSuccessfulRequests: config.skipSuccessfulRequests,
    skipFailedRequests: config.skipFailedRequests,
    keyGenerator: config.keyGenerator || ((req: Request) => req.ip),
    handler: (req: Request, res: Response) => {
      res.status(HttpStatus.TOO_MANY_REQUESTS).json({
        success: false,
        message: config.message,
        errorCode: 'RATE_LIMIT_EXCEEDED',
        timestamp: new Date().toISOString(),
        retryAfter: Math.round(config.windowMs / 1000)
      });
    }
  });
};

/**
 * General API rate limiter
 */
export const apiRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per 15 minutes
  message: 'Too many API requests, please try again later'
});

/**
 * Authentication rate limiter (stricter)
 */
export const authRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 login attempts per 15 minutes
  message: 'Too many login attempts, please try again later',
  skipSuccessfulRequests: true // Don't count successful logins
});

/**
 * Registration rate limiter
 */
export const registrationRateLimit = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 registration attempts per hour
  message: 'Too many registration attempts, please try again later'
});

/**
 * Password reset rate limiter
 */
export const passwordResetRateLimit = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 password reset attempts per hour
  message: 'Too many password reset attempts, please try again later'
});

/**
 * File upload rate limiter
 */
export const uploadRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 file uploads per 15 minutes
  message: 'Too many file uploads, please try again later'
});

/**
 * Competition registration rate limiter
 */
export const competitionRegistrationRateLimit = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 competition registrations per hour
  message: 'Too many competition registrations, please try again later'
});

/**
 * Search rate limiter
 */
export const searchRateLimit = createRateLimiter({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // 30 searches per minute
  message: 'Too many search requests, please try again later'
});

/**
 * Admin action rate limiter
 */
export const adminRateLimit = createRateLimiter({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 50, // 50 admin actions per 5 minutes
  message: 'Too many admin actions, please try again later'
});

/**
 * Email sending rate limiter
 */
export const emailRateLimit = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 emails per hour per user
  message: 'Too many emails sent, please try again later',
  keyGenerator: (req: Request) => {
    // Use user ID if authenticated, otherwise IP
    return req.user?.id.toString() || req.ip;
  }
});

/**
 * Competition creation rate limiter
 */
export const competitionCreationRateLimit = createRateLimiter({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 5, // 5 competitions per day per organizer
  message: 'Too many competitions created today, please try again tomorrow',
  keyGenerator: (req: Request) => {
    return req.user?.id.toString() || req.ip;
  }
});

/**
 * Match result submission rate limiter
 */
export const matchResultRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // 30 match results per 15 minutes
  message: 'Too many match results submitted, please try again later'
});

/**
 * Public API rate limiter (more lenient)
 */
export const publicApiRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // 200 requests per 15 minutes for public endpoints
  message: 'Too many requests, please try again later'
});

/**
 * Webhook rate limiter
 */
export const webhookRateLimit = createRateLimiter({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 100 webhook calls per minute
  message: 'Webhook rate limit exceeded'
});

/**
 * Export rate limiter (for data export)
 */
export const exportRateLimit = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 exports per hour
  message: 'Too many export requests, please try again later',
  keyGenerator: (req: Request) => {
    return req.user?.id.toString() || req.ip;
  }
});

/**
 * Flexible rate limiter for specific endpoints
 */
export const createCustomRateLimit = (
  windowMinutes: number,
  maxRequests: number,
  message?: string,
  keyGenerator?: (req: Request) => string
) => {
  return createRateLimiter({
    windowMs: windowMinutes * 60 * 1000,
    max: maxRequests,
    message: message || `Too many requests, please try again in ${windowMinutes} minutes`,
    keyGenerator
  });
};

/**
 * Progressive rate limiter (increases restriction based on violations)
 */
export const createProgressiveRateLimit = (baseLimit: number, baseWindow: number) => {
  const violations = new Map<string, { count: number; lastViolation: Date }>();
  
  return createRateLimiter({
    windowMs: baseWindow,
    max: (req: Request) => {
      const key = req.ip;
      const violation = violations.get(key);
      
      if (!violation) return baseLimit;
      
      // Reset if last violation was more than 24 hours ago
      if (Date.now() - violation.lastViolation.getTime() > 24 * 60 * 60 * 1000) {
        violations.delete(key);
        return baseLimit;
      }
      
      // Reduce limit based on violation count
      return Math.max(1, baseLimit - (violation.count * 10));
    },
    onLimitReached: (req: Request) => {
      const key = req.ip;
      const violation = violations.get(key) || { count: 0, lastViolation: new Date() };
      violation.count++;
      violation.lastViolation = new Date();
      violations.set(key, violation);
    }
  });
};

/**
 * IP whitelist rate limiter (bypass for trusted IPs)
 */
export const createWhitelistRateLimit = (
  trustedIPs: string[],
  regularLimit: number,
  trustedLimit: number,
  windowMs: number
) => {
  return createRateLimiter({
    windowMs,
    max: (req: Request) => {
      return trustedIPs.includes(req.ip) ? trustedLimit : regularLimit;
    },
    message: 'Rate limit exceeded'
  });
};