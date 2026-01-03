import net from 'net';
import http from 'http';

/**
 * HTTP-to-TCP proxy для Cloudflare Tunnel
 * Дозволяє Railway підключатися до SQL Server через HTTP запити
 */

const SQL_HOST = process.env.DB_SERVER || '10.131.10.25';
const SQL_PORT = parseInt(process.env.DB_PORT || '1433');
const PROXY_PORT = parseInt(process.env.PROXY_PORT || '3002');

interface SQLConnection {
  socket: net.Socket;
  id: string;
  lastActivity: number;
}

const connections = new Map<string, SQLConnection>();

// Cleanup old connections
setInterval(() => {
  const now = Date.now();
  for (const [id, conn] of connections.entries()) {
    if (now - conn.lastActivity > 300000) { // 5 minutes
      console.log(`Closing idle connection ${id}`);
      conn.socket.destroy();
      connections.delete(id);
    }
  }
}, 60000);

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.method === 'POST' && req.url === '/sql-proxy') {
    let body = '';
    
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', () => {
      try {
        const { data, connectionId } = JSON.parse(body);
        
        if (!connectionId) {
          res.writeHead(400);
          res.end(JSON.stringify({ error: 'connectionId required' }));
          return;
        }

        let conn = connections.get(connectionId);

        if (!conn) {
          // Create new connection
          const socket = new net.Socket();
          
          socket.connect(SQL_PORT, SQL_HOST, () => {
            console.log(`Connected to SQL Server ${SQL_HOST}:${SQL_PORT} (ID: ${connectionId})`);
            conn = {
              socket,
              id: connectionId,
              lastActivity: Date.now()
            };
            connections.set(connectionId, conn);

            // Send initial data if provided
            if (data) {
              const buffer = Buffer.from(data, 'base64');
              socket.write(buffer);
            }
          });

          socket.on('error', (err) => {
            console.error(`SQL Socket error (ID: ${connectionId}):`, err);
            connections.delete(connectionId);
            res.writeHead(500);
            res.end(JSON.stringify({ error: err.message }));
          });

          socket.on('close', () => {
            console.log(`SQL connection closed (ID: ${connectionId})`);
            connections.delete(connectionId);
          });

          socket.on('data', (responseData) => {
            conn!.lastActivity = Date.now();
            res.writeHead(200);
            res.end(JSON.stringify({
              data: responseData.toString('base64'),
              connectionId
            }));
          });

        } else {
          // Use existing connection
          conn.lastActivity = Date.now();
          
          if (data) {
            const buffer = Buffer.from(data, 'base64');
            conn.socket.write(buffer);

            conn.socket.once('data', (responseData) => {
              res.writeHead(200);
              res.end(JSON.stringify({
                data: responseData.toString('base64'),
                connectionId
              }));
            });
          } else {
            res.writeHead(200);
            res.end(JSON.stringify({ connectionId }));
          }
        }

      } catch (error: any) {
        console.error('Proxy error:', error);
        res.writeHead(500);
        res.end(JSON.stringify({ error: error.message }));
      }
    });
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

server.listen(PROXY_PORT, '0.0.0.0', () => {
  console.log(`🔄 SQL Proxy server running on port ${PROXY_PORT}`);
  console.log(`📡 Proxying to SQL Server at ${SQL_HOST}:${SQL_PORT}`);
});

export default server;
