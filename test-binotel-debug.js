const axios = require('axios');

async function debugBinotelFlow() {
  console.log('🔍 Deep debugging Binotel Call Password flow\n');

  const phone = '+380675307452';
  const basePayload = {
    key: '035963-ac29f32',
    secret: 'b3aa55-bf46d3-b0e6a6-99dc8a-8f8a984c',
    phoneNumberInE164: phone,
  };

  // Step 1: Send call
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('STEP 1: Sending verification call');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  try {
    const callPayload = {
      ...basePayload,
      application: 'NovaLoyalty',
      lifetime: '10',
      codeLength: '4',
    };

    console.log('Request payload:', JSON.stringify(callPayload, null, 2));

    const callResponse = await axios.post(
      'https://api.binotel.com/api/4.0/callpassword/verification-by-call-with-cid.json',
      callPayload,
      { headers: { 'Content-Type': 'application/json' }, timeout: 15000 }
    );

    console.log('Response:', JSON.stringify(callResponse.data, null, 2));
    console.log('');

    if (callResponse.data.status !== 'success') {
      console.log('❌ Failed to send call');
      return;
    }

    const verificationId = callResponse.data.verificationId;
    console.log('✅ Call sent! Verification ID:', verificationId);
    console.log('⏰ Wait for call and enter last 4 digits...');
    console.log('');

    // Step 2: Test various application names for verification
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('STEP 2: Testing verification with different params');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Enter the code from the call:');
    
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    rl.question('Code: ', async (code) => {
      console.log('');
      console.log('Testing code:', code);
      console.log('');

      const testCases = [
        { name: 'With application: NovaLoyalty', app: 'NovaLoyalty' },
        { name: 'Without application', app: null },
        { name: 'Empty application', app: '' },
        { name: 'With application: name', app: 'name' },
      ];

      for (const testCase of testCases) {
        console.log(`\n📋 ${testCase.name}`);
        
        const verifyPayload = {
          ...basePayload,
          code: code,
        };

        if (testCase.app !== null) {
          verifyPayload.application = testCase.app;
        }

        console.log('Payload:', JSON.stringify(verifyPayload, null, 2));

        try {
          const verifyResponse = await axios.post(
            'https://api.binotel.com/api/4.0/callpassword/checking-verification-code.json',
            verifyPayload,
            { headers: { 'Content-Type': 'application/json' }, timeout: 15000 }
          );

          console.log('Response:', JSON.stringify(verifyResponse.data, null, 2));

          if (verifyResponse.data.status === 'success') {
            console.log('\n🎉 SUCCESS! This configuration works!');
            console.log('Application:', testCase.app || '(none)');
            rl.close();
            return;
          }
        } catch (error) {
          if (error.response) {
            console.log('Response:', JSON.stringify(error.response.data, null, 2));
          } else {
            console.log('Error:', error.message);
          }
        }
      }

      console.log('\n❌ All configurations failed');
      rl.close();
    });

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

debugBinotelFlow();
