const axios = require('axios');

const credentials = {
  key: '035963-ac29f32',
  secret: 'b3aa55-bf46d3-b0e6a6-99dc8a-8f8a984c',
};

const testCases = [
  {
    name: 'Full request with all parameters',
    payload: {
      key: credentials.key,
      secret: credentials.secret,
      phoneNumberInE164: '380960608968',
      application: 'NovaLoyalty',
      lifetime: '10',
      codeLength: '4',
    }
  },
  {
    name: 'Without application',
    payload: {
      key: credentials.key,
      secret: credentials.secret,
      phoneNumberInE164: '380960608968',
      lifetime: '10',
      codeLength: '4',
    }
  },
  {
    name: 'Without codeLength',
    payload: {
      key: credentials.key,
      secret: credentials.secret,
      phoneNumberInE164: '380960608968',
      application: 'NovaLoyalty',
      lifetime: '10',
    }
  },
  {
    name: 'Without lifetime',
    payload: {
      key: credentials.key,
      secret: credentials.secret,
      phoneNumberInE164: '380960608968',
      application: 'NovaLoyalty',
      codeLength: '4',
    }
  },
  {
    name: 'Minimal request',
    payload: {
      key: credentials.key,
      secret: credentials.secret,
      phoneNumberInE164: '380960608968',
    }
  },
];

async function testBinotelAPI() {
  const API_URL = 'https://api.binotel.com/api/4.0/callpassword/verification-by-call-with-cid.json';

  console.log('🧪 Testing Binotel Call Password API');
  console.log('URL:', API_URL);
  console.log('');

  for (const testCase of testCases) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📋 Test: ${testCase.name}`);
    console.log('Payload:', JSON.stringify(testCase.payload, null, 2));
    console.log('');

    try {
      const response = await axios.post(API_URL, testCase.payload, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      });

      console.log('✅ Status:', response.status);
      console.log('Response:', JSON.stringify(response.data, null, 2));
      
      if (response.data.status === 'success') {
        console.log('🎉 SUCCESS! This configuration works!');
        break;
      }
    } catch (error) {
      if (error.response) {
        console.log('❌ Status:', error.response.status);
        console.log('Response:', JSON.stringify(error.response.data, null, 2));
      } else {
        console.log('❌ Error:', error.message);
      }
    }
    console.log('');
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log('📝 Висновок:');
  console.log('Якщо всі тести повертають "Not enough data" (code 103),');
  console.log('це означає що послуга Call Password ще не активована');
  console.log('або потрібні інші credentials.');
  console.log('');
  console.log('Зверніться до технічної підтримки Binotel:');
  console.log('- Підтвердіть активацію послуги Call Password');
  console.log('- Перевірте чи правильні credentials для Call Password API');
}

testBinotelAPI();
