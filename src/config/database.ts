import sql from 'mssql';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

// Динамічний import SQL Proxy Client
let SQLProxyClient: any;
try {
  SQLProxyClient = require(path.join(__dirname, '..', 'sql-proxy-client'));
  console.log('✅ SQL Proxy Client loaded successfully');
} catch (e) {
  console.warn('⚠️  SQL Proxy Client not found. Will use direct MSSQL only.');
  console.warn('   Error:', (e as Error).message);
}

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
  // Check if Proxy URL is configured (for Railway deployment)
  // Try multiple names in case Railway filters some
  const PROXY_URL = process.env.DATABASE_PROXY_URL || process.env.HTTP_PROXY_URL || process.env.SQL_PROXY_URL;
  
  console.log('🔍 Database connection check:');
  console.log('   DATABASE_PROXY_URL:', process.env.DATABASE_PROXY_URL ? 'SET' : 'NOT SET');
  console.log('   HTTP_PROXY_URL:', process.env.HTTP_PROXY_URL ? 'SET' : 'NOT SET');
  console.log('   SQL_PROXY_URL:', process.env.SQL_PROXY_URL ? 'SET' : 'NOT SET');
  console.log('   Using:', PROXY_URL ? `${PROXY_URL}` : 'DIRECT MSSQL');
  console.log('   DB_SERVER:', process.env.DB_SERVER || config.server);
  console.log('   SQLProxyClient available:', !!SQLProxyClient);
  
  // If proxy URL is set, use HTTP proxy instead of direct connection
  if (PROXY_URL && SQLProxyClient) {
    if (!proxyClient) {
      console.log('🌐 Using SQL HTTP Proxy for database access');
      proxyClient = new SQLProxyClient(PROXY_URL);
      await proxyClient.connect();
    }
    return proxyClient;
  }

  // Otherwise use direct MSSQL connection
  console.log('📡 Using direct MSSQL connection');
  if (!pool) {
    pool = await sql.connect(config);
    console.log('✅ Connected to SQL Server');
  }
  return pool;
}

export async function closeConnection(): Promise<void> {
  const PROXY_URL = process.env.DATABASE_PROXY_URL || process.env.HTTP_PROXY_URL || process.env.SQL_PROXY_URL;
  
  if (PROXY_URL && proxyClient) {
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
  
  // Check if this is a SQL Proxy connection (no request method)
  if (!connection.request) {
    // SQL Proxy - replace parameters in query string
    let finalQuery = queryText;
    if (params) {
      Object.keys(params).forEach((key) => {
        const value = params[key];
        // Escape single quotes and wrap strings in quotes
        const escapedValue = typeof value === 'string' 
          ? `'${value.replace(/'/g, "''")}'` 
          : value;
        // Replace @param with actual value
        finalQuery = finalQuery.replace(new RegExp(`@${key}`, 'g'), escapedValue);
      });
    }
    const result = await connection.query(finalQuery);
    return result;
  }
  
  // Direct MSSQL connection
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
