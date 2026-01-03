import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';

// Логування у файл
const logFilePath = path.join(__dirname, '../../logs/api.log');
const errorLogPath = path.join(__dirname, '../../logs/error.log');

// Створення директорії для логів
const logsDir = path.dirname(logFilePath);
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

interface LogEntry {
  timestamp: string;
  method: string;
  url: string;
  ip: string;
  userAgent: string;
  statusCode?: number;
  responseTime?: number;
  error?: string;
}

/**
 * Форматування лог запису
 */
const formatLog = (entry: LogEntry): string => {
  return JSON.stringify(entry) + '\n';
};

/**
 * Запис у файл
 */
const writeToFile = (filePath: string, data: string) => {
  fs.appendFile(filePath, data, (err) => {
    if (err) console.error('❌ Failed to write log:', err);
  });
};

/**
 * Middleware для логування запитів
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const userAgent = req.get('user-agent') || 'unknown';

  // Логування початку запиту
  const logEntry: LogEntry = {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.originalUrl || req.url,
    ip,
    userAgent,
  };

  console.log(`📥 ${logEntry.method} ${logEntry.url} - ${ip}`);

  // Перехоплення response для логування результату
  const originalSend = res.send;
  res.send = function (data) {
    const responseTime = Date.now() - startTime;
    
    logEntry.statusCode = res.statusCode;
    logEntry.responseTime = responseTime;

    // Логування в консоль
    const emoji = res.statusCode >= 400 ? '❌' : '✅';
    console.log(`${emoji} ${logEntry.method} ${logEntry.url} - ${res.statusCode} (${responseTime}ms)`);

    // Логування у файл
    writeToFile(logFilePath, formatLog(logEntry));

    // Виклик оригінального send
    return originalSend.call(this, data);
  };

  next();
};

/**
 * Middleware для логування помилок
 */
export const errorLogger = (err: Error, req: Request, res: Response, next: NextFunction) => {
  const logEntry: LogEntry = {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.originalUrl || req.url,
    ip: req.ip || req.socket.remoteAddress || 'unknown',
    userAgent: req.get('user-agent') || 'unknown',
    statusCode: 500,
    error: err.message,
  };

  console.error(`❌ ERROR: ${err.message}`);
  console.error(err.stack);

  // Логування помилки у файл
  writeToFile(errorLogPath, formatLog(logEntry));

  next(err);
};

/**
 * Детальне логування (для дебагу)
 */
export const detailedLogger = (req: Request, res: Response, next: NextFunction) => {
  console.log('🔍 Detailed Request:');
  console.log('  Method:', req.method);
  console.log('  URL:', req.originalUrl);
  console.log('  Headers:', JSON.stringify(req.headers, null, 2));
  console.log('  Body:', JSON.stringify(req.body, null, 2));
  console.log('  Query:', JSON.stringify(req.query, null, 2));
  console.log('  Params:', JSON.stringify(req.params, null, 2));
  
  next();
};

/**
 * Middleware для додавання request ID
 */
export const requestId = (req: Request, res: Response, next: NextFunction) => {
  const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  (req as any).id = id;
  res.setHeader('X-Request-Id', id);
  next();
};

/**
 * Очистка старих логів (файли старші 30 днів)
 */
export const cleanupOldLogs = () => {
  const logsDirectory = path.join(__dirname, '../../logs');
  const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 днів

  fs.readdir(logsDirectory, (err, files) => {
    if (err) return;

    files.forEach(file => {
      const filePath = path.join(logsDirectory, file);
      fs.stat(filePath, (err, stats) => {
        if (err) return;

        if (Date.now() - stats.mtime.getTime() > maxAge) {
          fs.unlink(filePath, (err) => {
            if (err) console.error(`Failed to delete old log: ${file}`);
            else console.log(`🗑️  Deleted old log: ${file}`);
          });
        }
      });
    });
  });
};

// Запускати очистку щодня
setInterval(cleanupOldLogs, 24 * 60 * 60 * 1000);
