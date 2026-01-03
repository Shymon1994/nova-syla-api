/**
 * Тест верифікації коду знаючи caller ID
 */

const axios = require('axios');
require('dotenv').config();

const BINOTEL_KEY = process.env.BINOTEL_KEY;
const BINOTEL_SECRET = process.env.BINOTEL_SECRET;

// Запитуємо у користувача
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('\n🔍 Тест верифікації коду з Binotel Call Password');
console.log('================================================\n');
console.log('Номери які дзвонили:');
console.log('  1. +380895726693 → код: 6693');
console.log('  2. +380895731363 → код: 1363');
console.log('  3. +380895735348 → код: 5348');
console.log('');

rl.question('На який номер клієнта дзвонили з +380895735348? (наприклад +380675307452): ', async (clientPhone) => {
  const code = '5348';
  
  console.log('\n📋 Параметри:');
  console.log('  Номер клієнта:', clientPhone);
  console.log('  Caller ID:', '+380895735348');
  console.log('  Код (останні 4 цифри):', code);
  console.log('');

  // Форматування номера (без + і тільки цифри)
  const phoneE164 = clientPhone.replace(/[^0-9]/g, '');
  
  console.log('  Phone E164:', phoneE164);
  console.log('  Application: NovaLoyalty');
  console.log('');

  try {
    const payload = {
      key: BINOTEL_KEY,
      secret: BINOTEL_SECRET,
      phoneNumberInE164: phoneE164,
      code: code,
      application: 'NovaLoyalty',
    };

    console.log('📤 Request to Binotel:');
    console.log(JSON.stringify(payload, null, 2));
    console.log('');

    const response = await axios.post(
      'https://api.binotel.com/api/4.0/callpassword/checking-verification-code.json',
      payload,
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000,
      }
    );

    console.log('📥 Response from Binotel:');
    console.log(JSON.stringify(response.data, null, 2));
    console.log('');

    if (response.data.status === 'success') {
      console.log('✅ SUCCESS! Код підтверджено!');
    } else {
      console.log('❌ FAILED:', response.data.message);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }

  rl.close();
});
