const axios = require('axios');

const code = process.argv[2];

if (!code) {
  console.log('Usage: node test-verify.js <CODE>');
  console.log('Example: node test-verify.js 1234');
  process.exit(1);
}

async function testVerifyCode() {
  const BASE_URL = 'http://localhost:3001/api/v2/auth';
  const TEST_PHONE = '+380675307452';

  console.log('🔍 Testing code verification');
  console.log('Phone:', TEST_PHONE);
  console.log('Code:', code);
  console.log('');

  try {
    const response = await axios.post(`${BASE_URL}/verify-code`, {
      phone: TEST_PHONE,
      code: code,
    });

    console.log('✅ Success!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    console.log('');
    
    if (response.data.data.token) {
      console.log('🎉 Authentication successful!');
      console.log('JWT Token:', response.data.data.token.substring(0, 50) + '...');
      console.log('');
      console.log('User Info:');
      console.log('- Name:', response.data.data.user.name);
      console.log('- Phone:', response.data.data.user.phone);
      console.log('- Balance:', response.data.data.user.balance);
      console.log('- Level:', response.data.data.user.level);
    }
  } catch (error) {
    console.error('❌ Error!');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Message:', error.message);
    }
  }
}

testVerifyCode();
