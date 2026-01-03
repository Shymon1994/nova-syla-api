import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'nova-syla-secret-key-2025';
const ADMIN_PHONES = ['+380960608968', '+380501234567'];

export interface AuthRequest extends Request {
  user?: {
    phone: string;
    clientId?: string;
    isAdmin: boolean;
  };
}

/**
 * Middleware для перевірки JWT токена
 */
export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'Authentication token required',
      });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    req.user = {
      phone: decoded.phone,
      clientId: decoded.clientId,
      isAdmin: ADMIN_PHONES.includes(decoded.phone),
    };

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'INVALID_TOKEN',
      message: 'Invalid or expired token',
    });
  }
};

/**
 * Middleware для перевірки адміністратора
 */
export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'UNAUTHORIZED',
      message: 'Authentication required',
    });
  }

  if (!req.user.isAdmin) {
    return res.status(403).json({
      success: false,
      error: 'FORBIDDEN',
      message: 'Admin access required',
    });
  }

  next();
};

/**
 * Middleware для опціональної аутентифікації (не обов'язкова)
 */
export const optionalAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, JWT_SECRET) as any;

      req.user = {
        phone: decoded.phone,
        clientId: decoded.clientId,
        isAdmin: ADMIN_PHONES.includes(decoded.phone),
      };
    }
    
    next();
  } catch (error) {
    // Ігноруємо помилки для опціональної аутентифікації
    next();
  }
};

/**
 * Генерація JWT токена
 */
export const generateToken = (phone: string, clientId?: string): string => {
  return jwt.sign(
    { 
      phone, 
      clientId,
      isAdmin: ADMIN_PHONES.includes(phone),
      iat: Math.floor(Date.now() / 1000),
    },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
};

/**
 * Верифікація JWT токена
 */
export const verifyToken = (token: string): any => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};
