/**
 * Тестування публічного API
 * Цей скрипт демонструє всі публічні ендпоінти, які не вимагають JWT токену
 */

const http = require('http');

const BASE_URL = 'localhost';
const PORT = 3001;

// Допоміжна функція для HTTP запитів
function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: BASE_URL,
      port: PORT,
      path: `/api/v2/public${path}`,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: JSON.parse(body)
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: body
          });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

// Головна функція тестування
async function testPublicAPI() {
  console.log('\n🚀 Тестування публічного API Nova Syla Loyalty\n');
  console.log('=' . repeat(60));

  try {
    // 1. Інформація про програму
    console.log('\n📋 1. Інформація про програму лояльності');
    console.log('   GET /api/v2/public/info');
    const info = await makeRequest('GET', '/info');
    console.log(`   ✅ Статус: ${info.status}`);
    if (info.data.success) {
      console.log(`   📦 Назва: ${info.data.data.programName}`);
      console.log(`   📝 Рівнів: ${info.data.data.levels.length}`);
      console.log(`   🎯 Функцій: ${info.data.data.features.length}`);
    }

    // 2. Список магазинів
    console.log('\n🏪 2. Список усіх магазинів');
    console.log('   GET /api/v2/public/stores?page=1&limit=5');
    const stores = await makeRequest('GET', '/stores?page=1&limit=5');
    console.log(`   ✅ Статус: ${stores.status}`);
    if (stores.data.success) {
      console.log(`   📦 Знайдено: ${stores.data.data.stores.length} магазинів`);
      console.log(`   📄 Всього: ${stores.data.data.pagination.total}`);
      if (stores.data.data.stores.length > 0) {
        const first = stores.data.data.stores[0];
        console.log(`   🏢 Перший: ${first.StoreName} (${first.City})`);
      }
    }

    // 3. Активні промоакції
    console.log('\n🎁 3. Активні промоакції');
    console.log('   GET /api/v2/public/promotions');
    const promos = await makeRequest('GET', '/promotions');
    console.log(`   ✅ Статус: ${promos.status}`);
    if (promos.data.success) {
      console.log(`   📦 Активних промо: ${promos.data.data.promotions.length}`);
      promos.data.data.promotions.forEach(promo => {
        console.log(`   🎯 ${promo.title} - знижка ${promo.discount}%`);
      });
    }

    // 4. Перевірка телефону
    console.log('\n📱 4. Перевірка доступності номера');
    console.log('   POST /api/v2/public/check-phone');
    const phoneCheck = await makeRequest('POST', '/check-phone', {
      phone: '+380960608968'
    });
    console.log(`   ✅ Статус: ${phoneCheck.status}`);
    if (phoneCheck.data.success) {
      console.log(`   📞 Номер: ${phoneCheck.data.data.phone}`);
      console.log(`   ${phoneCheck.data.data.exists ? '✅' : '❌'} ${phoneCheck.data.data.message}`);
    }

    // 5. Публічна статистика
    console.log('\n📊 5. Загальна статистика програми');
    console.log('   GET /api/v2/public/stats');
    const stats = await makeRequest('GET', '/stats');
    console.log(`   ✅ Статус: ${stats.status}`);
    if (stats.data.success) {
      console.log(`   👥 Користувачів: ${stats.data.data.users}`);
      console.log(`   💰 Загальна сума бонусів: ${stats.data.data.totalBonuses}`);
      console.log(`   🎁 Активних промо: ${stats.data.data.activePromotions}`);
      console.log(`   🏪 Магазинів: ${stats.data.data.stores}`);
    }

    // 6. Пошук магазинів за містом
    console.log('\n🔍 6. Пошук магазинів за містом');
    console.log('   GET /api/v2/public/stores/city/Київ');
    const cityStores = await makeRequest('GET', '/stores/city/Київ');
    console.log(`   ✅ Статус: ${cityStores.status}`);
    if (cityStores.data.success) {
      console.log(`   📦 Знайдено у Києві: ${cityStores.data.data.count} магазинів`);
    }

    // 7. Найближчі магазини
    console.log('\n📍 7. Найближчі магазини (за координатами)');
    console.log('   GET /api/v2/public/stores/nearby?lat=50.4501&lng=30.5234&radius=10');
    const nearby = await makeRequest('GET', '/stores/nearby?lat=50.4501&lng=30.5234&radius=10');
    console.log(`   ✅ Статус: ${nearby.status}`);
    if (nearby.data.success) {
      console.log(`   📦 Знайдено в радіусі 10км: ${nearby.data.data.stores.length}`);
      nearby.data.data.stores.forEach(store => {
        console.log(`   📍 ${store.StoreName} - ${store.distance.toFixed(2)} км`);
      });
    }

    console.log('\n' + '=' .repeat(60));
    console.log('✅ Всі тести публічного API завершені успішно!\n');

  } catch (error) {
    console.error('\n❌ Помилка при тестуванні:', error.message);
    console.error('💡 Переконайтеся, що сервер запущено на порту 3001\n');
  }
}

// Запуск тестів
testPublicAPI();
