const axios = require('axios');

async function testAuth() {
  console.log('🔐 ТЕСТУВАННЯ АВТОРИЗАЦІЇ\n');
  console.log('═══════════════════════════════════════════════════════════\n');

  const testCases = [
    { phone: '+380679175108', expectedName: 'Шимон Василь Федорович' },
    { phone: '+380679508133', expectedName: 'Андрусь Іван Васильович' },
    { phone: '+380960608968', expectedName: 'Василь Іванович Шимон' },
    { phone: '+380111111111', expectedName: null }, // Не існує
  ];

  for (const testCase of testCases) {
    console.log(`\n📱 Тестування: ${testCase.phone}`);
    console.log('─────────────────────────────────────────────────────────────');

    try {
      const response = await axios.post(
        'http://localhost:3001/api/auth/login',
        { phone: testCase.phone },
        { 
          headers: { 'Content-Type': 'application/json' },
          timeout: 5000 
        }
      );

      if (response.data.success) {
        const client = response.data.data;
        console.log('✅ Авторизація успішна!');
        console.log(`   ID: ${client.clientId}`);
        console.log(`   Ім'я: ${client.name}`);
        console.log(`   Телефон: ${client.phone}`);
        console.log(`   Баланс: ${client.balance} грн`);
        console.log(`   Рівень: ${client.level}`);
        
        if (testCase.expectedName) {
          const nameMatch = client.name.includes(testCase.expectedName.split(' ')[0]);
          if (nameMatch) {
            console.log('   ✓ Ім\'я відповідає очікуваному');
          } else {
            console.log(`   ⚠️ Ім'я не збігається (очікувалось: ${testCase.expectedName})`);
          }
        }
      } else {
        console.log('❌ Авторизація відхилена:', response.data.message);
      }

    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        console.log('❌ Сервер не запущений! Запустіть: npm start');
        break;
      } else if (error.response) {
        if (error.response.status === 404) {
          console.log('❌ Клієнта не знайдено (очікувано)');
        } else {
          console.log(`❌ Помилка ${error.response.status}: ${error.response.data.message}`);
        }
      } else {
        console.log('❌ Помилка:', error.message);
      }
    }
  }

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('               ТЕСТУВАННЯ ЗАВЕРШЕНО');
  console.log('═══════════════════════════════════════════════════════════\n');
}

testAuth();
