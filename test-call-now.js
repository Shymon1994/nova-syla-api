/**
 * Тест Call Password з номером +380953501751
 */

const axios = require('axios');
require('dotenv').config();

const BINOTEL_KEY = process.env.BINOTEL_KEY;
const BINOTEL_SECRET = process.env.BINOTEL_SECRET;

const testPhone = '+380953501751';
const phoneE164 = testPhone.replace(/[^0-9]/g, '');

async function testCallPassword() {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  🔐 BINOTEL CALL PASSWORD TEST');
  console.log('═══════════════════════════════════════════════════════════\n');

  console.log('📋 Параметри:');
  console.log(`  Номер:              ${testPhone}`);
  console.log(`  E164 формат:        ${phoneE164}`);
  console.log(`  Application:        NovaLoyalty`);
  console.log(`  Lifetime:           10 хвилин`);
  console.log(`  Code Length:        4 цифри\n`);

  try {
    // Крок 1: Відправка дзвінка
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  📤 КРОК 1: Відправка дзвінка');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    const requestPayload = {
      key: BINOTEL_KEY,
      secret: BINOTEL_SECRET,
      phoneNumberInE164: phoneE164,
      application: 'NovaLoyalty',
      lifetime: '10',
      codeLength: '4',
    };

    console.log('📦 Request payload:');
    console.log(JSON.stringify(requestPayload, null, 2));
    console.log('');

    const startTime = Date.now();
    const response = await axios.post(
      'https://api.binotel.com/api/4.0/callpassword/verification-by-call-with-cid.json',
      requestPayload,
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 15000,
      }
    );
    const requestTime = Date.now() - startTime;

    console.log('📥 Response:');
    console.log(`  HTTP Status:        ${response.status}`);
    console.log(`  Response Time:      ${requestTime}ms`);
    console.log('  Data:', JSON.stringify(response.data, null, 2));
    console.log('');

    if (response.data.status !== 'success') {
      console.log('❌ Помилка відправки дзвінка:');
      console.log(`   Status: ${response.data.status}`);
      console.log(`   Message: ${response.data.message}\n`);
      return;
    }

    console.log('✅ Дзвінок відправлено успішно!');
    console.log(`   Verification ID: ${response.data.verificationId}`);
    console.log(`   Waiting Time: ${response.data.waitingTime} секунд\n`);

    // Крок 2: Інструкції
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  📞 КРОК 2: ОЧІКУЙ ДЗВІНОК');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`  На номер ${testPhone} зараз надійде дзвінок`);
    console.log('');
    console.log('  🔍 ВАЖЛИВО:');
    console.log('  1. Подивись який номер дзвонить (caller ID)');
    console.log('  2. Візьми ОСТАННІ 4 ЦИФРИ цього номера');
    console.log('  3. Це і є твій код верифікації');
    console.log('');
    console.log('  Приклад:');
    console.log('    Дзвонить: +380895735348');
    console.log('    КОД:      5348');
    console.log('');
    console.log('  📝 Запиши caller ID та останні 4 цифри,');
    console.log('     потім запусти test-verify-manual.js для перевірки\n');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Зберігаємо дані для верифікації
    console.log('💾 Дані для верифікації збережено:');
    console.log(`   Phone: ${phoneE164}`);
    console.log(`   Application: NovaLoyalty`);
    console.log(`   Verification ID: ${response.data.verificationId}\n`);

  } catch (error) {
    console.log('\n❌ ПОМИЛКА:\n');
    console.log('  Message:', error.message);
    if (error.response) {
      console.log('  HTTP Status:', error.response.status);
      console.log('  Response:', JSON.stringify(error.response.data, null, 2));
    }
    console.log('');
  }
}

testCallPassword();
