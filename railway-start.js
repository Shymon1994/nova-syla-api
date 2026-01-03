#!/usr/bin/env node

/**
 * Railway Startup Script
 * Перевіряє доступність БД перед запуском
 */

const { execSync } = require('child_process');

console.log('🚀 Railway Startup Script');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Перевірка змінних оточення
const requiredEnvVars = ['DB_SERVER', 'DB_DATABASE', 'DB_USER', 'DB_PASSWORD'];
const missingVars = requiredEnvVars.filter(v => !process.env[v]);

if (missingVars.length > 0) {
  console.warn('⚠️  Missing environment variables:', missingVars.join(', '));
  console.warn('⚠️  Starting server in LIMITED mode (without database)');
  process.env.DB_DISABLED = 'true';
}

// Запуск сервера
console.log('✅ Starting Nova Syla API Server...\n');
try {
  execSync('node dist/server.v2.js', { stdio: 'inherit' });
} catch (error) {
  console.error('❌ Server failed to start:', error.message);
  process.exit(1);
}
