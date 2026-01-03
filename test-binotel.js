const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api/v2/auth';
const TEST_PHONE = '+380960608968';

async function testRequestCode() {
  console.log('📞 Testing Call Password request...');
  console.log(`Phone: ${TEST_PHONE}`);
  console.log('');

  try {
    const response = await axios.post(`${BASE_URL}/request-code`, {
      phone: TEST_PHONE,
    });

    console.log('✅ Success!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    console.log('');
    console.log('⏰ Очікуйте дзвінок на номер:', TEST_PHONE);
    console.log('📱 Введіть останні 4 цифри номера, з якого надійшов дзвінок');
    console.log('');
    console.log('Тепер запустіть: node test-binotel.js verify <CODE>');
  } catch (error) {
    console.error('❌ Error!');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Message:', error.message);
    }
  }
}

async function testVerifyCode(code) {
  console.log('🔍 Testing code verification...');
  console.log(`Phone: ${TEST_PHONE}`);
  console.log(`Code: ${code}`);
  console.log('');

  try {
    const response = await axios.post(`${BASE_URL}/verify-code`, {
      phone: TEST_PHONE,
      code: code,
    });

    console.log('✅ Success! Code verified!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    console.log('');
    console.log('🎉 JWT Token:', response.data.data.token.substring(0, 50) + '...');
    console.log('👤 User:', response.data.data.user.name);
    console.log('💰 Balance:', response.data.data.user.balance);
  } catch (error) {
    console.error('❌ Error!');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Message:', error.message);
    }
  }
}

// Main
const command = process.argv[2];
const code = process.argv[3];

if (command === 'verify' && code) {
  testVerifyCode(code);
} else if (command === 'request' || !command) {
  testRequestCode();
} else {
  console.log('Usage:');
  console.log('  node test-binotel.js request          - Request code');
  console.log('  node test-binotel.js verify <code>    - Verify code');
}
