const axios = require('axios');

async function testPhoneFormats() {
  const API_URL = 'https://api.binotel.com/api/4.0/callpassword/verification-by-call-with-cid.json';
  
  const phoneFormats = [
    '+380960608968',
    '380960608968',
    '0960608968',
    '+38 096 060 89 68',
    '38 096 060 89 68',
  ];

  console.log('🧪 Testing different phone number formats\n');

  for (const phone of phoneFormats) {
    const payload = {
      key: '035963-ac29f32',
      secret: 'b3aa55-bf46d3-b0e6a6-99dc8a-8f8a984c',
      phoneNumberInE164: phone,
      application: 'NovaLoyalty',
      lifetime: '10',
      codeLength: '4',
    };

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Testing phone:', phone);

    try {
      const response = await axios.post(API_URL, payload, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 15000,
      });

      console.log('Status:', response.status);
      console.log('Response:', JSON.stringify(response.data, null, 2));

      if (response.data.status === 'success') {
        console.log('\n🎉 SUCCESS! Phone format:', phone);
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

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('❌ Жоден формат не спрацював. Послуга не активована.');
}

testPhoneFormats();
