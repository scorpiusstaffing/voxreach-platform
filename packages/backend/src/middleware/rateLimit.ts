import { Request, Response, NextFunction } from 'express';
import { config } from '../config';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

// Clean up old entries every minute
setInterval(() => {
  const now = Date.now();
  for (const key in store) {
    if (store[key].resetTime < now) {
      delete store[key];
    }
  }
}, 60000);

export function rateLimit(options: {
  windowMs: number;
  max: number;
  keyGenerator?: (req: Request) => string;
  skip?: (req: Request) => boolean;
}) {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    max = 100, // limit each IP to 100 requests per windowMs
    keyGenerator = (req) => req.ip || 'unknown',
    skip = () => false,
  } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    // Skip rate limiting in development for easier testing
    if (config.nodeEnv === 'development' && req.ip === '::1') {
      return next();
    }

    // Skip if configured
    if (skip(req)) {
      return next();
    }

    const key = keyGenerator(req);
    const now = Date.now();

    if (!store[key] || store[key].resetTime < now) {
      // New window
      store[key] = {
        count: 1,
        resetTime: now + windowMs,
      };
    } else {
      // Increment existing window
      store[key].count++;
    }

    const current = store[key];
    const remaining = Math.max(0, max - current.count);

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', max.toString());
    res.setHeader('X-RateLimit-Remaining', remaining.toString());
    res.setHeader('X-RateLimit-Reset', Math.ceil(current.resetTime / 1000).toString());

    if (current.count > max) {
      // Too many requests
      const retryAfter = Math.ceil((current.resetTime - now) / 1000);
      res.setHeader('Retry-After', retryAfter.toString());
      
      return res.status(429).json({
        success: false,
        error: 'Too many requests, please try again later.',
        retryAfter,
      });
    }

    next();
  };
}

// Default rate limiter for API routes
export const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per IP
  skip: (req) => {
    // Skip rate limiting for webhooks (they come from external services)
    return req.path.startsWith('/api/webhooks');
  },
});

// Stricter rate limiter for auth endpoints
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Only 10 login attempts per IP
  keyGenerator: (req) => {
    // Use IP + email for auth endpoints to prevent brute force
    const ip = req.ip || 'unknown';
    const email = req.body?.email || 'unknown';
    return `${ip}:${email}`;
  },
});

// Loose rate limiter for public endpoints
export const publicRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // 300 requests per IP
});