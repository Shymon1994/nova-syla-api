/**
 * Швидкий тест - відразу вводиш код після дзвінка
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

async function quickTest() {
  console.log('\n🚀 ШВИДКИЙ ТЕСТ BINOTEL CALL PASSWORD\n');

  const phone = await question('📱 Номер телефону (наприклад +380953501751): ');
  const phoneE164 = phone.replace(/[^0-9]/g, '');

  console.log(`\n📞 Відправляю дзвінок на ${phoneE164}...\n`);

  try {
    // Відправка дзвінка
    const requestPayload = {
      key: BINOTEL_KEY,
      secret: BINOTEL_SECRET,
      phoneNumberInE164: phoneE164,
      application: 'NovaLoyalty',
      lifetime: '10',
      codeLength: '4',
    };

    const response = await axios.post(
      'https://api.binotel.com/api/4.0/callpassword/verification-by-call-with-cid.json',
      requestPayload,
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 15000,
      }
    );

    if (response.data.status !== 'success') {
      console.log('❌ Помилка:', response.data.message);
      rl.close();
      return;
    }

    console.log('✅ Дзвінок відправлено!');
    console.log(`   Verification ID: ${response.data.verificationId}\n`);
    console.log('⏱️  Чекай дзвінок, подивись caller ID і ШВИДКО введи останні 4 цифри!\n');

    // Чекаємо код
    const code = await question('🔢 Введи КОД (останні 4 цифри caller ID): ');

    console.log(`\n🔍 Перевіряю код ${code}...\n`);

    // Перевірка коду
    const verifyPayload = {
      key: BINOTEL_KEY,
      secret: BINOTEL_SECRET,
      phoneNumberInE164: phoneE164,
      code: code.trim(),
      application: 'NovaLoyalty',
    };

    console.log('📤 Payload:');
    console.log(JSON.stringify(verifyPayload, null, 2));
    console.log('');

    const verifyResponse = await axios.post(
      'https://api.binotel.com/api/4.0/callpassword/checking-verification-code.json',
      verifyPayload,
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000,
      }
    );

    console.log('📥 Response:');
    console.log(JSON.stringify(verifyResponse.data, null, 2));
    console.log('');

    if (verifyResponse.data.status === 'success') {
      console.log('╔═══════════════════════════════════════╗');
      console.log('║   ✅  УСПІХ! КОД ПІДТВЕРДЖЕНО!  ✅   ║');
      console.log('╚═══════════════════════════════════════╝\n');
    } else {
      console.log('╔═══════════════════════════════════════╗');
      console.log('║      ❌  ПОМИЛКА ВЕРИФІКАЦІЇ  ❌      ║');
      console.log('╚═══════════════════════════════════════╝');
      console.log(`Status: ${verifyResponse.data.status}`);
      console.log(`Message: ${verifyResponse.data.message}\n`);
    }

  } catch (error) {
    console.log('\n❌ ПОМИЛКА:', error.message);
    if (error.response) {
      console.log('Response:', JSON.stringify(error.response.data, null, 2));
    }
  }

  rl.close();
}

quickTest();
