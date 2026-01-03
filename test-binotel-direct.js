const axios = require('axios');

async function directBinotelTest() {
  const API_URL = 'https://api.binotel.com/api/4.0/callpassword/verification-by-call-with-cid.json';
  
  const payload = {
    key: '035963-ac29f32',
    secret: 'b3aa55-bf46d3-b0e6a6-99dc8a-8f8a984c',
    phoneNumberInE164: '+380675307452',
    application: 'NovaLoyalty',
    lifetime: '10',
    codeLength: '4',
  };

  console.log('🧪 Direct Binotel API Test');
  console.log('URL:', API_URL);
  console.log('Payload:', JSON.stringify(payload, null, 2));
  console.log('');

  try {
    const response = await axios.post(API_URL, payload, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 15000,
    });

    console.log('✅ Success!');
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('❌ Error!');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Status Text:', error.response.statusText);
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Message:', error.message);
    }
  }
}

directBinotelTest();
