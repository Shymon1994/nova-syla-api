/**
 * Повний тест Call Password з детальними логами
 * 1. Відправляємо дзвінок
 * 2. Чекаємо caller ID
 * 3. Перевіряємо код
 */

const axios = require('axios');
require('dotenv').config();

const BINOTEL_KEY = process.env.BINOTEL_KEY;
const BINOTEL_SECRET = process.env.BINOTEL_SECRET;

const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function fullTest() {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  🔐 BINOTEL CALL PASSWORD - ПОВНИЙ ТЕСТ З ЛОГАМИ');
  console.log('═══════════════════════════════════════════════════════════\n');

  // Крок 1: Запитуємо номер
  const phoneInput = await question('📱 Введи номер телефону для тесту (наприклад +380671234567): ');
  const phoneE164 = phoneInput.replace(/[^0-9]/g, '');
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  📋 ПАРАМЕТРИ ЗАПИТУ');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  Оригінальний ввід:  ${phoneInput}`);
  console.log(`  Формат E164:        ${phoneE164}`);
  console.log(`  Application:        NovaLoyalty`);
  console.log(`  Lifetime:           10 хвилин`);
  console.log(`  Code Length:        4 цифри`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    // Крок 2: Відправка дзвінка
    console.log('📤 КРОК 1: Відправка запиту до Binotel...\n');
    
    const requestPayload = {
      key: BINOTEL_KEY,
      secret: BINOTEL_SECRET,
      phoneNumberInE164: phoneE164,
      application: 'NovaLoyalty',
      lifetime: '10',
      codeLength: '4',
    };

    console.log('📦 Payload:');
    console.log(JSON.stringify(requestPayload, null, 2));
    console.log('');
    console.log('🌐 URL: https://api.binotel.com/api/4.0/callpassword/verification-by-call-with-cid.json');
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

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  📥 ВІДПОВІДЬ ВІД BINOTEL');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`  HTTP Status:        ${response.status}`);
    console.log(`  Response Time:      ${requestTime}ms`);
    console.log('  Response Data:');
    console.log(JSON.stringify(response.data, null, 2));
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    if (response.data.status !== 'success') {
      console.log('❌ ПОМИЛКА: Не вдалося відправити дзвінок');
      console.log('   Status:', response.data.status);
      console.log('   Message:', response.data.message);
      rl.close();
      return;
    }

    const verificationId = response.data.verificationId;
    const waitingTime = response.data.waitingTime;

    console.log('✅ Дзвінок успішно відправлено!');
    console.log(`   Verification ID: ${verificationId}`);
    console.log(`   Очікуваний час дзвінка: ${waitingTime} секунд\n`);

    // Крок 3: Очікування дзвінка
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  ⏳ КРОК 2: ОЧІКУВАННЯ ДЗВІНКА');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`  📞 Зараз на номер ${phoneInput} надійде дзвінок від Binotel`);
    console.log('  🔍 ВАЖЛИВО: Подивись на caller ID (номер який дзвонить)');
    console.log('  📝 КОД = останні 4 цифри номера який дзвонить\n');
    console.log('  Очікування...\n');

    const callerNumber = await question('📱 Який номер показується на телефоні? (наприклад +380895735348): ');
    const lastFourDigits = callerNumber.replace(/[^0-9]/g, '').slice(-4);

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  🔐 КРОК 3: ПЕРЕВІРКА КОДУ');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`  Caller ID:          ${callerNumber}`);
    console.log(`  Останні 4 цифри:    ${lastFourDigits}`);
    console.log(`  Номер клієнта:      ${phoneE164}`);
    console.log(`  Application:        NovaLoyalty`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const verifyPayload = {
      key: BINOTEL_KEY,
      secret: BINOTEL_SECRET,
      phoneNumberInE164: phoneE164,
      code: lastFourDigits,
      application: 'NovaLoyalty',
    };

    console.log('📤 Відправка запиту верифікації...\n');
    console.log('📦 Payload:');
    console.log(JSON.stringify(verifyPayload, null, 2));
    console.log('');
    console.log('🌐 URL: https://api.binotel.com/api/4.0/callpassword/checking-verification-code.json');
    console.log('');

    const verifyStartTime = Date.now();
    const verifyResponse = await axios.post(
      'https://api.binotel.com/api/4.0/callpassword/checking-verification-code.json',
      verifyPayload,
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000,
      }
    );
    const verifyTime = Date.now() - verifyStartTime;

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  📥 ВІДПОВІДЬ ВЕРИФІКАЦІЇ');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`  HTTP Status:        ${verifyResponse.status}`);
    console.log(`  Response Time:      ${verifyTime}ms`);
    console.log('  Response Data:');
    console.log(JSON.stringify(verifyResponse.data, null, 2));
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    if (verifyResponse.data.status === 'success') {
      console.log('╔═══════════════════════════════════════════════════════╗');
      console.log('║                                                       ║');
      console.log('║           ✅  УСПІХ! КОД ПІДТВЕРДЖЕНО!  ✅            ║');
      console.log('║                                                       ║');
      console.log('╚═══════════════════════════════════════════════════════╝\n');
    } else {
      console.log('╔═══════════════════════════════════════════════════════╗');
      console.log('║                                                       ║');
      console.log('║              ❌  ПОМИЛКА ВЕРИФІКАЦІЇ  ❌              ║');
      console.log('║                                                       ║');
      console.log('╚═══════════════════════════════════════════════════════╝');
      console.log(`  Status:  ${verifyResponse.data.status}`);
      console.log(`  Message: ${verifyResponse.data.message}\n`);
    }

  } catch (error) {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  ❌ ПОМИЛКА');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  Error:', error.message);
    if (error.response) {
      console.log('  HTTP Status:', error.response.status);
      console.log('  Response Data:', JSON.stringify(error.response.data, null, 2));
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  }

  rl.close();
}

// Запуск
fullTest();
