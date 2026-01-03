const axios = require('axios');

const API_URL = 'http://localhost:3001/api'; // Оновлено на правильний порт

async function testLogin() {
  console.log('🧪 ТЕСТУВАННЯ ОНОВЛЕНОГО API\n');
  console.log('═══════════════════════════════════════════════════════════\n');

  const testPhones = [
    '+380679175108', // Має бути в базі
    '+380960608968', // Василь Іванович
    '+380685072915', // Тестовий клієнт
    '+380111111111', // Не існує
  ];

  for (const phone of testPhones) {
    console.log(`\n📞 Тестування номера: ${phone}`);
    console.log('─────────────────────────────────────────────────────────────');

    try {
      // 1. Перевірка існування
      console.log('1️⃣ Перевірка існування (GET /api/auth/check/:phone)');
      const checkResponse = await axios.get(`${API_URL}/auth/check/${phone}`);
      console.log(`   Результат: exists=${checkResponse.data.exists}, count=${checkResponse.data.count || 0}`);

      // 2. Логін
      console.log('2️⃣ Логін (POST /api/auth/login)');
      const loginResponse = await axios.post(`${API_URL}/auth/login`, { phone });
      
      if (loginResponse.data.success) {
        console.log('   ✅ Успішно!');
        console.log('   Дані клієнта:');
        console.log(`      ID: ${loginResponse.data.data.clientId}`);
        console.log(`      Ім'я: ${loginResponse.data.data.name}`);
        console.log(`      Телефон: ${loginResponse.data.data.phone}`);
        console.log(`      Баланс: ${loginResponse.data.data.balance}`);
        console.log(`      Рівень: ${loginResponse.data.data.level}`);
      } else {
        console.log(`   ❌ Помилка: ${loginResponse.data.message}`);
      }

    } catch (error) {
      if (error.response) {
        console.log(`   ❌ Помилка ${error.response.status}: ${error.response.data.message}`);
      } else {
        console.log(`   ❌ Помилка: ${error.message}`);
      }
    }
  }

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('                   ТЕСТУВАННЯ ЗАВЕРШЕНО');
  console.log('═══════════════════════════════════════════════════════════\n');
}

// Перевірка чи запущений сервер
axios.get(`${API_URL}/health`)
  .then(() => {
    console.log('✅ Сервер запущений\n');
    testLogin();
  })
  .catch(() => {
    console.log('❌ Сервер не запущений!');
    console.log('   Запустіть сервер командою: npm start\n');
  });
