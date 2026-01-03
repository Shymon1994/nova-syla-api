const http = require('http');
const sql = require('mssql');
const crypto = require('crypto');

const PORT = 3002;

// Security: API Key authentication
const API_KEY = process.env.SQL_PROXY_API_KEY || 'CHANGE_THIS_SECRET_KEY_' + crypto.randomBytes(32).toString('hex');
console.log('🔐 SQL Proxy API Key:', API_KEY);

// SQL Server connection config
const sqlConfig = {
  server: '10.131.10.25',
  port: 1433,
  database: 'AZIT',
  user: 'zeus',
  password: 'zeus',
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  },
  requestTimeout: 30000,
  connectionTimeout: 30000
};

const server = http.createServer(async (req, res) => {
  // CORS headers - restrict to Railway domain only
  const allowedOrigins = [
    'https://nova-syla-api-production.up.railway.app',
    'http://localhost:3001',
    'http://127.0.0.1:3001'
  ];
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-Key');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Security: Check API Key
  const apiKey = req.headers['x-api-key'];
  if (!apiKey || apiKey !== API_KEY) {
    console.log('⛔ Unauthorized access attempt');
    res.writeHead(401);
    res.end(JSON.stringify({ error: 'Unauthorized - Invalid API Key' }));
    return;
  }

  if (req.method !== 'POST') {
    res.writeHead(405);
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
  });

  req.on('end', async () => {
    try {
      const { query, parameters } = JSON.parse(body);
      
      if (!query) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'Query required' }));
        return;
      }

      // Security: Block dangerous SQL operations
      const dangerousKeywords = [
        /\bDROP\s+TABLE\b/i,
        /\bDROP\s+DATABASE\b/i,
        /\bTRUNCATE\b/i,
        /\bEXEC\s*\(/i,
        /\bEXECUTE\s*\(/i,
        /xp_cmdshell/i,
        /sp_executesql/i
      ];
      
      const isDangerous = dangerousKeywords.some(pattern => pattern.test(query));
      if (isDangerous) {
        console.log('⛔ Blocked dangerous query:', query);
        res.writeHead(403);
        res.end(JSON.stringify({ error: 'Forbidden - Dangerous query blocked' }));
        return;
      }

      console.log(`📊 Executing query: ${query.substring(0, 100)}...`);
      
      const pool = await sql.connect(sqlConfig);
      const request = pool.request();

      // Add parameters if provided
      if (parameters) {
        for (const [key, value] of Object.entries(parameters)) {
          request.input(key, value);
        }
      }

      const result = await request.query(query);
      
      res.writeHead(200);
      res.end(JSON.stringify({
        success: true,
        recordset: result.recordset,
        rowsAffected: result.rowsAffected
      }));

      await pool.close();

    } catch (error) {
      console.error('❌ SQL Error:', error);
      res.writeHead(500);
      res.end(JSON.stringify({
        success: false,
        error: error.message
      }));
    }
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 SQL HTTP Proxy running on http://0.0.0.0:${PORT}`);
  console.log(`📡 Connected to SQL Server: ${sqlConfig.server}:${sqlConfig.port}`);
});
