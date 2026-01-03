const axios = require('axios');

const credentials = {
  key: '035963-ac29f32',
  secret: 'b3aa55-bf46d3-b0e6a6-99dc8a-8f8a984c',
};

// Тестуємо з різними application names
const applications = [
  'NovaLoyalty',
  'name', // як в прикладі з документації
  'NovaSyla',
  'Feedback',
  'LoyaltyApp',
  'test',
  'app',
  '',
];

async function testApplications() {
  const API_URL = 'https://api.binotel.com/api/4.0/callpassword/verification-by-call-with-cid.json';

  console.log('🧪 Testing different application names\n');

  for (const app of applications) {
    const payload = {
      key: credentials.key,
      secret: credentials.secret,
      phoneNumberInE164: '380960608968',
      lifetime: '120', // як в прикладі
      codeLength: '4',
    };

    if (app) {
      payload.application = app;
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Testing with application: "${app || '(empty)'}"`);
    console.log('Payload:', JSON.stringify(payload, null, 2));

    try {
      const response = await axios.post(API_URL, payload, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 15000,
      });

      console.log('Status:', response.status);
      console.log('Response:', JSON.stringify(response.data, null, 2));

      if (response.data.status === 'success') {
        console.log('\n🎉 SUCCESS! Working configuration found!');
        console.log('Application name:', app || '(empty)');
        return;
      }
    } catch (error) {
      if (error.response) {
        console.log('Status:', error.response.status);
        console.log('Response:', JSON.stringify(error.response.data, null, 2));
      } else {
        console.log('Error:', error.message);
      }
    }
    console.log('');
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('❌ Всі варіанти повертають помилку.');
  console.log('📝 Висновок: Послуга Call Password не активована або');
  console.log('   application name потрібно попередньо зареєструвати в Binotel.');
}

testApplications();
