const axios = require('axios');

const code = process.argv[2];

if (!code) {
  console.log('Usage: node test-binotel-verify.js <CODE>');
  process.exit(1);
}

async function testBinotelVerify() {
  const API_URL = 'https://api.binotel.com/api/4.0/callpassword/checking-verification-code.json';
  
  const payload = {
    key: '035963-ac29f32',
    secret: 'b3aa55-bf46d3-b0e6a6-99dc8a-8f8a984c',
    phoneNumberInE164: '+380675307452',
    application: 'NovaLoyalty',
    code: code,
  };

  console.log('🔍 Testing code verification directly with Binotel');
  console.log('Phone:', '+380675307452');
  console.log('Code:', code);
  console.log('');

  try {
    const response = await axios.post(API_URL, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 15000,
    });

    console.log('✅ Status:', response.status);
    console.log('Response:', JSON.stringify(response.data, null, 2));

    if (response.data.status === 'success') {
      console.log('\n🎉 Code is VALID!');
    } else {
      console.log('\n❌ Code is INVALID');
    }
  } catch (error) {
    if (error.response) {
      console.log('❌ Status:', error.response.status);
      console.log('Response:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.log('❌ Error:', error.message);
    }
  }
}

testBinotelVerify();
