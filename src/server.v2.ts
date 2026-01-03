import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';

// V1 Routes (старі)
import authRoutesV1 from './routes/auth';
import clientRoutesV1 from './routes/client';
import qrRoutesV1 from './routes/qr';
import adminRoutesV1 from './routes/admin';
import promoRoutes from './routes/promo';
import storesRoutes from './routes/stores';

// V2 Routes (нові з потужною архітектурою)
import authRoutesV2 from './routes/auth.v2';
import clientRoutesV2 from './routes/client.v2';
import qrRoutesV2 from './routes/qr.v2';
import adminRoutesV2 from './routes/admin.v2';
import publicRoutesV2 from './routes/public.v2';

// Middleware
import { requestLogger, errorLogger, requestId } from './middleware/logger.middleware';
import { generalLimiter } from './middleware/rateLimiter.middleware';
import { sendError } from './utils/response.util';

import { closeConnection } from './config/database';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const API_VERSION = '2.0.0';

// Security Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS Configuration
app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001', 
      'http://localhost:8080',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
      'http://127.0.0.1:8080'
    ];
    
    if (!origin || allowedOrigins.includes(origin) || origin.startsWith('http://localhost:')) {
      callback(null, true);
    } else {
      callback(null, true); // Для розробки дозволяємо все
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Access-Control-Request-Private-Network'],
  exposedHeaders: ['Content-Length', 'X-Request-Id'],
  preflightContinue: false,
  optionsSuccessStatus: 204,
}));

// Additional headers for local development
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Private-Network', 'true');
  next();
});

app.options('*', cors());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Статичні файли для документації
app.use(express.static(path.join(__dirname, '../public')));

// Custom Middleware
app.use(requestId);
app.use(requestLogger);
app.use(generalLimiter);

// ===== API Documentation =====
app.get('/', (req: Request, res: Response) => {
  // Якщо запит з браузера - показуємо HTML
  if (req.headers.accept?.includes('text/html')) {
    res.sendFile(path.join(__dirname, '../public/index.html'));
  } else {
    // Якщо JSON запит - віддаємо JSON
    res.json({
      name: 'Nova Syla Loyalty API',
      version: API_VERSION,
      documentation: '/api/docs',
      status: 'operational',
      endpoints: {
        v1: {
          auth: {
            login: 'POST /api/auth/login',
            check: 'GET /api/auth/check/:phone',
          },
          client: {
            getClient: 'GET /api/client/:phone',
          },
          qr: {
            generate: 'POST /api/qr/generate',
            validate: 'GET /api/qr/validate/:qrToken',
            use: 'POST /api/qr/use',
            history: 'GET /api/qr/history/:phone',
          },
          admin: {
            stats: 'GET /api/admin/stats',
            users: 'GET /api/admin/users',
            promotions: 'GET /api/admin/promotions',
          },
        },
        v2: {
          auth: {
            login: 'POST /api/v2/auth/login - Returns JWT token',
            verify: 'GET /api/v2/auth/verify - Requires: Bearer token',
            refresh: 'POST /api/v2/auth/refresh - Requires: Bearer token',
            logout: 'POST /api/v2/auth/logout - Requires: Bearer token',
          },
          client: {
            me: 'GET /api/v2/client/me - Get current user data - Requires: Bearer token',
            update: 'PUT /api/v2/client/me - Update profile - Requires: Bearer token',
            balance: 'GET /api/v2/client/me/balance - Requires: Bearer token',
            transactions: 'GET /api/v2/client/me/transactions - Requires: Bearer token',
          },
          qr: {
            generate: 'POST /api/v2/qr/generate - Rate limited - Requires: Bearer token',
            validate: 'GET /api/v2/qr/validate/:token',
            use: 'POST /api/v2/qr/use - Process payment - Requires: Bearer token',
            history: 'GET /api/v2/qr/history - Requires: Bearer token',
          },
          admin: {
            stats: 'GET /api/v2/admin/stats - Requires: Bearer token + Admin',
            users: 'GET /api/v2/admin/users - Requires: Bearer token + Admin',
            promotions: 'GET /api/v2/admin/promotions - Requires: Bearer token + Admin',
            createPromotion: 'POST /api/v2/admin/promotions - Requires: Bearer token + Admin',
            updatePromotion: 'PUT /api/v2/admin/promotions/:id - Requires: Bearer token + Admin',
            deletePromotion: 'DELETE /api/v2/admin/promotions/:id - Requires: Bearer token + Admin',
            transactions: 'GET /api/v2/admin/transactions - Requires: Bearer token + Admin',
            promoCodes: 'POST /api/v2/admin/promo-codes - Requires: Bearer token + Admin',
            logs: 'GET /api/v2/admin/logs - Requires: Bearer token + Admin',
          },
          public: {
            info: 'GET /api/v2/public/info - Program information',
            stores: 'GET /api/v2/public/stores - List of stores',
            storesByCity: 'GET /api/v2/public/stores/city/:city - Stores by city',
            nearbyStores: 'GET /api/v2/public/stores/nearby?lat=&lng=&radius= - Nearby stores',
            promotions: 'GET /api/v2/public/promotions - Active promotions',
            checkPhone: 'POST /api/v2/public/check-phone - Check phone availability',
            qrValidate: 'GET /api/v2/public/qr/validate/:token - Validate QR code',
            stats: 'GET /api/v2/public/stats - Public statistics',
          },
        },
      },
      features: {
        authentication: 'JWT Bearer tokens',
        rateLimiting: 'Express rate limiter',
        validation: 'Zod schemas',
        logging: 'File-based request/error logging',
        security: 'Helmet + CORS',
        errorHandling: 'Centralized error responses',
      },
    });
  }
});

// API Documentation endpoint
app.get('/api/docs', (req: Request, res: Response) => {
  res.json({
    version: API_VERSION,
    authentication: {
      type: 'Bearer JWT',
      header: 'Authorization: Bearer <token>',
      howToGetToken: 'POST /api/v2/auth/login with phone number',
      tokenExpiry: '30 days',
    },
    rateLimits: {
      general: '100 requests per 15 minutes',
      auth: '5 attempts per 15 minutes',
      qr: '10 generations per 5 minutes',
      admin: '50 requests per 15 minutes',
    },
    errorCodes: {
      BAD_REQUEST: 400,
      UNAUTHORIZED: 401,
      FORBIDDEN: 403,
      NOT_FOUND: 404,
      CONFLICT: 409,
      TOO_MANY_REQUESTS: 429,
      INTERNAL_SERVER_ERROR: 500,
    },
    responseFormat: {
      success: {
        success: true,
        data: 'any',
        message: 'string (optional)',
        meta: 'object (optional, for pagination)',
      },
      error: {
        success: false,
        error: 'ERROR_CODE',
        message: 'Human readable message',
        details: 'any (optional)',
      },
    },
  });
});

// ===== API V1 Routes (Legacy - backward compatibility) =====
app.use('/api/auth', authRoutesV1);
app.use('/api/client', clientRoutesV1);
app.use('/api/qr', qrRoutesV1);
app.use('/api/admin', adminRoutesV1);
app.use('/api/promo', promoRoutes);
app.use('/api/stores', storesRoutes);
app.use('/api/admin', storesRoutes);

// ===== API V2 Routes (New powerful architecture) =====
app.use('/api/v2/auth', authRoutesV2);
app.use('/api/v2/client', clientRoutesV2);
app.use('/api/v2/qr', qrRoutesV2);
app.use('/api/v2/admin', adminRoutesV2);
app.use('/api/v2/admin', storesRoutes);
app.use('/api/v2/stores', storesRoutes);
app.use('/api/v2/public', publicRoutesV2);

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'healthy', 
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    version: API_VERSION,
  });
});

// Ping endpoint
app.get('/ping', (req: Request, res: Response) => {
  res.send('pong');
});

// 404 handler
app.use((req: Request, res: Response) => {
  sendError(res, 'NOT_FOUND', `Endpoint ${req.method} ${req.path} not found`, 404);
});

// Error handler
app.use(errorLogger);
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('❌ Unhandled error:', err);
  sendError(
    res,
    'INTERNAL_SERVER_ERROR',
    'An unexpected error occurred',
    500,
    process.env.NODE_ENV === 'development' ? { message: err.message, stack: err.stack } : undefined
  );
});

// Graceful shutdown - тільки при явній команді зупинки (Ctrl+C)
// Не зупиняємося при отриманні SIGINT від інших процесів
let shuttingDown = false;

process.on('SIGINT', async () => {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log('\n🛑 Отримано SIGINT - зупиняємо сервер...');
  await closeConnection();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log('\n🛑 Отримано SIGTERM - зупиняємо сервер...');
  await closeConnection();
  process.exit(0);
});

// Обробка помилок
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  // Не зупиняємо сервер при помилках
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  // Не зупиняємо сервер при помилках
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║          🚀 Nova Syla Loyalty API Server                 ║
║                                                           ║
║  Version: ${API_VERSION}                                    ║
║  Port: ${PORT}                                              ║
║  Environment: ${process.env.NODE_ENV || 'development'}                       ║
║                                                           ║
║  📚 API Docs: http://localhost:${PORT}/api/docs            ║
║  🏥 Health: http://localhost:${PORT}/health                ║
║                                                           ║
║  Features:                                                ║
║    ✓ JWT Authentication                                   ║
║    ✓ Rate Limiting                                        ║
║    ✓ Request Validation (Zod)                             ║
║    ✓ Error Handling                                       ║
║    ✓ Request Logging                                      ║
║    ✓ API Versioning (v1, v2)                              ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);
});

export default app;
