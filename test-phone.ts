import sql from 'mssql';

const config: sql.config = {
  server: '10.131.10.25',
  database: 'AZIT',
  user: 'zeus',
  password: 'zeus',
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
  connectionTimeout: 15000,
  requestTimeout: 15000,
};

async function testPhone() {
  try {
    console.log('🔌 Підключення до SQL Server...');
    const pool = await sql.connect(config);
    console.log('✅ Підключено до SQL Server\n');

    const phone = '+380960608968';
    console.log(`📞 Перевірка номера: ${phone}\n`);

    // Виклик stored procedure
    const result = await pool
      .request()
      .input('PhoneNum', sql.NVarChar, phone)
      .execute('AZIT.dbo.zeus_GetCli');

    console.log('📊 Результат з SQL:');
    console.log('='.repeat(60));
    
    if (result.recordset && result.recordset.length > 0) {
      const record = result.recordset[0];
      console.log('✅ Клієнта знайдено!\n');
      
      console.log('Дані клієнта:');
      console.log('-'.repeat(60));
      console.log(`ClientID:     ${record.ClientID || record.Id || record.ID || record.RECID || 'N/A'}`);
      console.log(`Телефон:      ${phone}`);
      console.log(`ПІБ (Name):   ${record.Name || 'N/A'}`);
      console.log(`ПІБ (NAME):   ${record.NAME || 'N/A'}`);
      console.log(`ПІБ (F7):     ${record.F7 || 'N/A'}`);
      console.log(`ПІБ (ClientName): ${record.ClientName || 'N/A'}`);
      console.log(`ПІБ (FullName):   ${record.FullName || 'N/A'}`);
      console.log(`Баланс:       ${record.Balance || record.BonusBalance || 0} грн`);
      console.log(`Рівень:       ${record.Level || record.ClientLevel || 'Бронза'}`);
      console.log(`Email:        ${record.Email || 'N/A'}`);
      console.log(`Місто:        ${record.City || record.CityName || 'N/A'}`);
      console.log('-'.repeat(60));
      
      console.log('\n📋 Всі поля в результаті:');
      console.log(JSON.stringify(record, null, 2));
      
      // Показуємо яке ім'я буде використано
      let finalName = record.Name || record.ClientName || record.FullName || record.F7 || record.NAME;
      
      // Видаляємо "(Менеджер)" якщо є
      if (finalName && typeof finalName === 'string') {
        finalName = finalName.replace(/\s*\([^)]*\)\s*/g, '').trim();
      }
      
      console.log(`\n✨ Ім'я для відображення: "${finalName}"`);
      
      // Форматуємо як в додатку
      if (finalName) {
        const parts = finalName.trim().split(/\s+/);
        let formatted = finalName;
        
        if (parts.length > 1) {
          const surname = parts[0];
          const initials = parts.slice(1).map((n: string) => n[0].toUpperCase() + '.').join(' ');
          formatted = `${surname} ${initials}`;
        }
        
        console.log(`📱 В додатку буде: "Вітаю, ${formatted}"`);
      }
      
    } else {
      console.log('❌ Клієнта з таким номером НЕ ЗНАЙДЕНО');
      console.log('Можливі причини:');
      console.log('  • Номер не зареєстрований в базі');
      console.log('  • Невірний формат номера');
      console.log('  • Stored procedure zeus_GetCli не працює');
    }

    await pool.close();
    console.log('\n✅ З\'єднання закрито');
    
  } catch (error: any) {
    console.error('❌ Помилка:', error.message);
    if (error.code) {
      console.error('Код помилки:', error.code);
    }
    if (error.number) {
      console.error('SQL Error Number:', error.number);
    }
    process.exit(1);
  }
}

testPhone();
