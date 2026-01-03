const https = require('https');

// Cloudflare API credentials
const CF_API_KEY = '134fb45887ff5d95a89ae218d8e685bec142a';
const CF_EMAIL = 'Shumonvasya@gmail.com';
const CF_ZONE_ID = '259f641599ff8d5025eed10bb06596fc'; // Zone ID для ns_loyaliti.com

// Tunnel details
const TUNNEL_ID = '4ebb7f85-6e21-4fd4-b2ca-c194d10dad66';
const HOSTNAME = 'sqlproxy.ns-loyaliti.com'; // Без подвійних доменів

function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          resolve(body);
        }
      });
    });
    
    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function createDNSRecord() {
  console.log('🔧 Creating DNS CNAME record...');
  
  const options = {
    hostname: 'api.cloudflare.com',
    path: `/client/v4/zones/${CF_ZONE_ID}/dns_records`,
    method: 'POST',
    headers: {
      'X-Auth-Email': CF_EMAIL,
      'X-Auth-Key': CF_API_KEY,
      'Content-Type': 'application/json'
    }
  };

  const data = {
    type: 'CNAME',
    name: HOSTNAME,
    content: `${TUNNEL_ID}.cfargotunnel.com`,
    ttl: 1, // Auto
    proxied: true
  };

  try {
    const result = await makeRequest(options, data);
    if (result.success) {
      console.log('✅ DNS record created successfully!');
      console.log(`📝 ${HOSTNAME} → ${TUNNEL_ID}.cfargotunnel.com`);
      return true;
    } else {
      console.log('⚠️ DNS record may already exist or error:', result.errors || result);
      return false;
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Cloudflare DNS Setup for SQL HTTP Proxy\n');
  
  await createDNSRecord();
  
  console.log('\n📋 Next steps:');
  console.log('1. Make sure SQL HTTP Proxy is running: node sql-http-proxy.js');
  console.log('2. Make sure Cloudflare Tunnel is running:');
  console.log('   cloudflared tunnel --config cloudflare-tunnel-config.yml run');
  console.log(`3. Test: curl -X POST https://${HOSTNAME} -H "Content-Type: application/json" -d "{\\"query\\":\\"SELECT 1\\"}"`);
  console.log(`4. Add to Railway: DB_PROXY_URL=https://${HOSTNAME}`);
}

main();
