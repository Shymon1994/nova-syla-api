/**
 * Отримання списку телефонних номерів компанії з Binotel
 */

const axios = require('axios');
require('dotenv').config();

const BINOTEL_KEY = process.env.BINOTEL_KEY;
const BINOTEL_SECRET = process.env.BINOTEL_SECRET;
const BINOTEL_COMPANY_ID = process.env.BINOTEL_COMPANY_ID;

async function getCompanyNumbers() {
  try {
    console.log('\n📋 Отримання списку номерів компанії в Binotel');
    console.log('================================================\n');

    // Binotel API для отримання списку номерів
    // https://api.binotel.com/api/4.0/settings/phone-numbers.json
    
    const payload = {
      key: BINOTEL_KEY,
      secret: BINOTEL_SECRET,
    };

    console.log('📤 Request URL:', 'https://api.binotel.com/api/4.0/settings/phone-numbers.json');
    console.log('📤 Request payload:', JSON.stringify(payload, null, 2));

    const response = await axios.post(
      'https://api.binotel.com/api/4.0/settings/phone-numbers.json',
      payload,
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 15000,
      }
    );

    console.log('\n📥 Response:');
    console.log(JSON.stringify(response.data, null, 2));

    if (response.data.phoneNumbers && response.data.phoneNumbers.length > 0) {
      console.log('\n✅ Phone numbers found:');
      response.data.phoneNumbers.forEach((num, index) => {
        console.log(`  ${index + 1}. ${num.phoneNumber} - ${num.description || 'No description'}`);
        console.log(`     Last 4 digits: ${num.phoneNumber.slice(-4)}`);
      });
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
  }
}

// Запуск
getCompanyNumbers();
