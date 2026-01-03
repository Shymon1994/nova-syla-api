import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';

/**
 * Rate limiter для загальних запитів
 */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 хвилин
  max: 100, // максимум 100 запитів
  message: {
    success: false,
    error: 'TOO_MANY_REQUESTS',
    message: 'Too many requests, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter для аутентифікації (строгіший)
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 хвилин
  max: 5, // максимум 5 спроб логіна
  message: {
    success: false,
    error: 'TOO_MANY_AUTH_ATTEMPTS',
    message: 'Too many authentication attempts, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // не рахувати успішні запити
});

/**
 * Rate limiter для генерації QR кодів
 */
export const qrLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 хвилин
  max: 10, // максимум 10 QR кодів за 5 хвилин
  message: {
    success: false,
    error: 'QR_RATE_LIMIT_EXCEEDED',
    message: 'Too many QR codes generated, please wait',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter для адмін панелі (дуже строгий)
 */
export const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: {
    success: false,
    error: 'ADMIN_RATE_LIMIT_EXCEEDED',
    message: 'Too many admin requests',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Простий in-memory rate limiter для IP адрес
 */
interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const ipStore: RateLimitStore = {};

export const ipRateLimiter = (maxRequests: number, windowMs: number) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();

    // Очистка старих записів
    if (ipStore[ip] && now > ipStore[ip].resetTime) {
      delete ipStore[ip];
    }

    // Ініціалізація або інкремент
    if (!ipStore[ip]) {
      ipStore[ip] = {
        count: 1,
        resetTime: now + windowMs,
      };
      return next();
    }

    ipStore[ip].count++;

    // Перевірка ліміту
    if (ipStore[ip].count > maxRequests) {
      return res.status(429).json({
        success: false,
        error: 'TOO_MANY_REQUESTS',
        message: 'Rate limit exceeded',
        retryAfter: Math.ceil((ipStore[ip].resetTime - now) / 1000),
      });
    }

    next();
  };
};

/**
 * Cleanup старих записів кожні 5 хвилин
 */
setInterval(() => {
  const now = Date.now();
  Object.keys(ipStore).forEach(ip => {
    if (ipStore[ip].resetTime < now) {
      delete ipStore[ip];
    }
  });
}, 5 * 60 * 1000);
