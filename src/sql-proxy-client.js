const axios = require('axios');

/**
 * SQL Proxy Client для Railway
 * Використовує HTTP proxy для доступу до AZIT бази через Cloudflare Tunnel
 */
class SQLProxyClient {
  constructor(proxyUrl) {
    this.proxyUrl = proxyUrl || process.env.SQL_PROXY_URL;
    if (!this.proxyUrl) {
      throw new Error('SQL_PROXY_URL is not configured');
    }
    console.log(`📡 Using SQL Proxy at: ${this.proxyUrl}`);
  }

  async query(sqlQuery) {
    try {
      const response = await axios.post(this.proxyUrl, {
        query: sqlQuery
      }, {
        headers: {
          'Content-Type': 'application/json'
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
