const axios = require('axios');

async function quickTest() {
  console.log('⚡ Швидкий тест оновленого API');
  console.log('═══════════════════════════════════════════════════════════\n');

  const phone = '+380679175108';
  
  try {
    console.log(`📞 Тестування логіну для: ${phone}\n`);
    
    const response = await axios.post('http://localhost:3001/api/auth/login', 
      { phone },
      { timeout: 5000 }
    );
    
    console.log('✅ УСПІХ!');
    console.log('\nВідповідь сервера:');
    console.log(JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ Сервер не запущений!');
      console.log('   Запустіть: npm start');
    } else if (error.response) {
      console.log(`❌ Помилка ${error.response.status}:`);
      console.log(JSON.stringify(error.response.data, null, 2));
    } else {
      console.log('❌ Помилка:', error.message);
    }
  }
  
  console.log('\n═══════════════════════════════════════════════════════════');
}

quickTest();
