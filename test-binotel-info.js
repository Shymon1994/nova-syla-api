/**
 * Тест для отримання детальної інформації про верифікацію
 * Подивимося що саме Binotel повертає при запиті коду
 */

const axios = require('axios');
require('dotenv').config();

const BINOTEL_KEY = process.env.BINOTEL_KEY;
const BINOTEL_SECRET = process.env.BINOTEL_SECRET;
const BINOTEL_COMPANY_ID = process.env.BINOTEL_COMPANY_ID;

// Використаємо новий номер
const TEST_PHONE = '380980000000'; // Тестовий номер

async function testCallPasswordInfo() {
  try {
    console.log('\n🔍 Тест отримання інформації про верифікацію Binotel Call Password');
    console.log('================================================\n');

    console.log('📋 Configuration:');
    console.log('  API Key:', BINOTEL_KEY);
    console.log('  Company ID:', BINOTEL_COMPANY_ID);
    console.log('  Phone:', TEST_PHONE);
    console.log('');

    // 1. Запит коду
    console.log('📤 Step 1: Запит Call Password дзвінка...');
    const requestPayload = {
      key: BINOTEL_KEY,
      secret: BINOTEL_SECRET,
      phoneNumberInE164: TEST_PHONE,
      application: 'NovaLoyalty',
      lifetime: '10',
      codeLength: '4',
    };

    console.log('📤 Request payload:', JSON.stringify(requestPayload, null, 2));

    const requestResponse = await axios.post(
      'https://api.binotel.com/api/4.0/callpassword/verification-by-call-with-cid.json',
      requestPayload,
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 15000,
      }
    );

    console.log('\n📥 Full Response:');
    console.log(JSON.stringify(requestResponse.data, null, 2));

    if (requestResponse.data.status === 'success') {
      console.log('\n✅ Success! Call initiated');
      console.log('📞 Verification ID:', requestResponse.data.verificationId);
      console.log('⏱️  Wait time:', requestResponse.data.waitingTime);
      console.log('📱 Application used:', 'NovaLoyalty');
      console.log('☎️  Phone format:', TEST_PHONE);
      
      // Зберігаємо дані для подальшої перевірки
      console.log('\n💾 Save these values for verification:');
      console.log('  - verificationId:', requestResponse.data.verificationId);
      console.log('  - phone:', TEST_PHONE);
      console.log('  - application: NovaLoyalty');
      console.log('  - code: [last 4 digits from caller ID]');
      
      console.log('\n⚠️  IMPORTANT: Write down the LAST 4 DIGITS from the caller ID');
      console.log('   Then use test-binotel-verify.js to check the code\n');
      
    } else {
      console.log('\n❌ Failed to send call');
      console.log('Status:', requestResponse.data.status);
      console.log('Message:', requestResponse.data.message);
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
  }
}

// Запуск тесту
testCallPasswordInfo();
