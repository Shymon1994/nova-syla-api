/**
 * ШВИДКИЙ ТЕСТ - відправка + одразу верифікація
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
  return new Promise((resolve) => rl.question(prompt, resolve));
}

async function quickTest() {
  const phone = '380953501751';
  
  console.log('\n🚀 ШВИДКИЙ ТЕСТ CALL PASSWORD\n');

  try {
    // 1. Відправка дзвінка
    console.log('📤 Відправляю дзвінок...');
    const response = await axios.post(
      'https://api.binotel.com/api/4.0/callpassword/verification-by-call-with-cid.json',
      {
        key: BINOTEL_KEY,
        secret: BINOTEL_SECRET,
        phoneNumberInE164: phone,
        application: 'NovaLoyalty',
        lifetime: '10',
        codeLength: '4',
      },
      { headers: { 'Content-Type': 'application/json' }, timeout: 15000 }
    );

    if (response.data.status !== 'success') {
      console.log('❌ Помилка:', response.data.message);
      rl.close();
      return;
    }

    console.log('✅ Дзвінок відправлено! ID:', response.data.verificationId);
    console.log('\n📞 ЗАРАЗ НАДІЙДЕ ДЗВІНОК!');
    console.log('🔍 Подивись останні 4 цифри caller ID\n');

    // 2. Одразу чекаємо код
    const code = await question('⚡ ШВИДКО! Введи код (останні 4 цифри): ');

    console.log('\n🔐 Перевіряю код', code, '...');

    // 3. Перевірка
    const verifyResponse = await axios.post(
      'https://api.binotel.com/api/4.0/callpassword/checking-verification-code.json',
      {
        key: BINOTEL_KEY,
        secret: BINOTEL_SECRET,
        phoneNumberInE164: phone,
        code: code.trim(),
        application: 'NovaLoyalty',
      },
      { headers: { 'Content-Type': 'application/json' }, timeout: 10000 }
    );

    console.log('\n📥 Відповідь:', JSON.stringify(verifyResponse.data, null, 2));

    if (verifyResponse.data.status === 'success') {
      console.log('\n🎉🎉🎉 УСПІХ! КОД ПІДТВЕРДЖЕНО! 🎉🎉🎉\n');
    } else {
      console.log('\n❌ Помилка:', verifyResponse.data.message);
      console.log('⏱️  Можливо код застарів або неправильний\n');
    }

  } catch (error) {
    console.log('\n❌ ERROR:', error.message);
    if (error.response) {
      console.log('Response:', error.response.data);
    }
  }

  rl.close();
}

quickTest();
