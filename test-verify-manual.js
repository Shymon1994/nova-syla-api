/**
 * Ручна перевірка коду після отримання дзвінка
 * Використовуй після того як отримаєш дзвінок і побачиш caller ID
 */

const axios = require('axios');
require('dotenv').config();

const BINOTEL_KEY = process.env.BINOTEL_KEY;
const BINOTEL_SECRET = process.env.BINOTEL_SECRET;

// Дані з попереднього тесту
const testPhone = '380953501751'; // БЕЗ +
const application = 'NovaLoyalty';

// ========================================
// ВВЕДИ ТУТ КОД З CALLER ID (останні 4 цифри):
const code = '3548'; // Реальний код з caller ID
// ========================================

async function verifyCode() {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  🔐 ПЕРЕВІРКА КОДУ ВЕРИФІКАЦІЇ');
  console.log('═══════════════════════════════════════════════════════════\n');

  console.log('📋 Параметри:');
  console.log(`  Phone E164:         ${testPhone}`);
  console.log(`  Code:               ${code}`);
  console.log(`  Application:        ${application}\n`);

  if (code === '5348') {
    console.log('⚠️  УВАГА: Це тестовий код! Введи реальний код з caller ID\n');
  }

  try {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  📤 Відправка запиту верифікації');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const payload = {
      key: BINOTEL_KEY,
      secret: BINOTEL_SECRET,
      phoneNumberInE164: testPhone,
      code: code,
      application: application,
    };

    console.log('📦 Request payload:');
    console.log(JSON.stringify(payload, null, 2));
    console.log('');

    const startTime = Date.now();
    const response = await axios.post(
      'https://api.binotel.com/api/4.0/callpassword/checking-verification-code.json',
      payload,
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000,
      }
    );
    const responseTime = Date.now() - startTime;

    console.log('📥 Response:');
    console.log(`  HTTP Status:        ${response.status}`);
    console.log(`  Response Time:      ${responseTime}ms`);
    console.log('  Data:', JSON.stringify(response.data, null, 2));
    console.log('');

    if (response.data.status === 'success') {
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
      console.log(`  Status:  ${response.data.status}`);
      console.log(`  Message: ${response.data.message}\n`);
      
      console.log('💡 Можливі причини:');
      console.log('   - Неправильний код (перевір останні 4 цифри caller ID)');
      console.log('   - Код застарів (lifetime = 10 хвилин)');
      console.log('   - Невірний номер телефону або application name\n');
    }

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

console.log('\n⚠️  Перед запуском:');
console.log('   1. Запусти test-call-now.js');
console.log('   2. Дочекайся дзвінка');
console.log('   3. Подивись caller ID (номер який дзвонить)');
console.log('   4. Відкрий цей файл і змінi змінну "code" на останні 4 цифри');
console.log('   5. Запусти цей скрипт: node test-verify-manual.js\n');

const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Натисни Enter для продовження або Ctrl+C для виходу...', () => {
  rl.close();
  verifyCode();
});
