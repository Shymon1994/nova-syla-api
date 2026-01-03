const axios = require('axios');

/**
 * SQL Proxy Client для Railway
 * Використовує HTTP proxy для доступу до AZIT бази через Cloudflare Tunnel
 */
class SQLProxyClient {
  constructor(proxyUrl) {
    this.proxyUrl = proxyUrl || process.env.SQL_PROXY_URL;
    // Try multiple environment variable names (Railway filters some patterns)
    this.apiKey = process.env.SQL_PROXY_API_KEY 
                  || process.env.DATABASE_API_KEY 
                  || process.env.HTTP_PROXY_API_KEY
                  || process.env.TUNNEL_API_KEY
                  || process.env.PROXY_AUTH_TOKEN
                  || process.env.DB_AUTH_TOKEN
                  || process.env.CLOUDFLARE_AUTH;
    
    if (!this.proxyUrl) {
      throw new Error('SQL_PROXY_URL is not configured');
    }
    if (!this.apiKey) {
      console.error('❌ API Key not found in any of: SQL_PROXY_API_KEY, DATABASE_API_KEY, HTTP_PROXY_API_KEY, TUNNEL_API_KEY, PROXY_AUTH_TOKEN, DB_AUTH_TOKEN, CLOUDFLARE_AUTH');
      console.error('Available env vars:', Object.keys(process.env).filter(k => k.includes('API') || k.includes('KEY')));
      throw new Error('API Key is not configured - check Railway Variables');
    }
    console.log(`📡 Using SQL Proxy at: ${this.proxyUrl}`);
    console.log(`🔑 API Key found (length: ${this.apiKey.length})`);
  }

  async query(sqlQuery) {
    try {
      const response = await axios.post(this.proxyUrl, {
        query: sqlQuery
      }, {
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey
        },
        timeout: 30000
      });

      if (response.data.success) {
        return {
          recordset: response.data.recordset || [],
          rowsAffected: response.data.rowsAffected || [0]
        };
      } else {
        throw new Error(response.data.error || 'SQL Proxy query failed');
      }
    } catch (error) {
      if (error.response) {
        console.error('SQL Proxy error:', error.response.data);
        throw new Error(`SQL Proxy error: ${error.response.data.error || error.message}`);
      }
      throw error;
    }
  }

  async connect() {
    // Test connection
    try {
      await this.query('SELECT 1 as test');
      console.log('✅ SQL Proxy connection successful');
      return true;
    } catch (error) {
      console.error('❌ SQL Proxy connection failed:', error.message);
      throw error;
    }
  }

  async close() {
    // No persistent connection to close
    console.log('SQL Proxy client closed');
  }
}

module.exports = SQLProxyClient;
