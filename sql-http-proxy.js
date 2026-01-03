const http = require('http');
const sql = require('mssql');

const PORT = 3002;

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
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
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

      console.log(`📊 Executing query: ${query}`);
      
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
