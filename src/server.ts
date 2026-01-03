import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import clientRoutes from './routes/client';
import qrRoutes from './routes/qr';
import adminRoutes from './routes/admin';
import { closeConnection } from './config/database';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS для веб-додатків
app.use(cors({
  origin: (origin, callback) => {
    // Дозволити всі origin для розробки, включаючи локальні
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001', 
      'http://localhost:8080',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
      'http://127.0.0.1:8080'
    ];
    
    // Дозволити будь-який origin під час розробки
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

// Додаткові заголовки для локальної розробки з Chrome
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Private-Network', 'true');
  next();
});

// Явна обробка OPTIONS запитів
app.options('*', cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Логування запитів
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Routes
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Nova Syla Loyalty API',
    version: '1.0.0',
    endpoints: {
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
    },
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/client', clientRoutes);
app.use('/api/qr', qrRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
  });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: Function) => {
  console.error('❌ Server error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// Graceful shutdown
// Тимчасово вимкнено для діагностики
// process.on('SIGINT', async () => {
//   console.log('\n🛑 Shutting down gracefully...');
//   await closeConnection();
//   process.exit(0);
// });

// process.on('SIGTERM', async () => {
//   console.log('\n🛑 Shutting down gracefully...');
//   await closeConnection();
//   process.exit(0);
// });

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📚 API docs: http://localhost:${PORT}/`);
});
