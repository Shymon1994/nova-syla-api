import sql from 'mssql';
import dotenv from 'dotenv';
const SQLProxyClient = require('./sql-proxy-client');

dotenv.config();

// Check if SQL Proxy URL is configured (for Railway deployment)
const SQL_PROXY_URL = process.env.SQL_PROXY_URL;

const config: sql.config = {
  server: process.env.DB_SERVER || '10.131.10.25',
  database: process.env.DB_DATABASE || 'AZIT',
  user: process.env.DB_USER || 'zeus',
  password: process.env.DB_PASSWORD || 'zeus',
  port: parseInt(process.env.DB_PORT || '1433'),
  options: {
    encrypt: false, // Для локальної мережі
    trustServerCertificate: true,
    enableArithAbort: true,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
  requestTimeout: 30000,
};

let pool: sql.ConnectionPool | null = null;
let proxyClient: any = null;

export async function getConnection(): Promise<sql.ConnectionPool | any> {
  // If SQL_PROXY_URL is set, use HTTP proxy instead of direct connection
  if (SQL_PROXY_URL) {
    if (!proxyClient) {
      console.log('🌐 Using SQL HTTP Proxy for database access');
      proxyClient = new SQLProxyClient(SQL_PROXY_URL);
      await proxyClient.connect();
    }
    return proxyClient;
  }

  // Otherwise use direct MSSQL connection
  if (!pool) {
    pool = await sql.connect(config);
    console.log('✅ Connected to SQL Server');
  }
  return pool;
}

export async function closeConnection(): Promise<void> {
  if (SQL_PROXY_URL && proxyClient) {
    await proxyClient.close();
    proxyClient = null;
    console.log('🔌 Disconnected from SQL Proxy');
  } else if (pool) {
    await pool.close();
    pool = null;
    console.log('🔌 Disconnected from SQL Server');
  }
}

// Helper function for executing queries
export async function query(queryText: string, params?: any): Promise<sql.IResult<any>> {
  const connection = await getConnection();
  const request = connection.request();
  
  // Add parameters if provided
  if (params) {
    Object.keys(params).forEach((key) => {
      request.input(key, params[key]);
    });
  }
  
  const result = await request.query(queryText);
  return result;
}
