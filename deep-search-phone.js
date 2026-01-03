const sql = require('mssql');

const config = {
  server: '10.131.10.25',
  database: 'AZIT',
  user: 'zeus',
  password: 'zeus',
  port: 1433,
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true,
  },
  requestTimeout: 30000,
};

async function findPhoneEverywhere() {
  const searchPhone = '679175108'; // пошук без префіксів
  
  console.log('🔍 ГЛИБОКИЙ ПОШУК НОМЕРА +380679175108 У ВСІХ ТАБЛИЦЯХ\n');
  console.log('═══════════════════════════════════════════════════════════\n');

  try {
    await sql.connect(config);
    console.log('✅ Підключено до бази AZIT\n');

    // Всі варіанти номера
    const phoneVariants = [
      '+380679175108',
      '380679175108',
      '0679175108',
      '679175108',
      '067-917-51-08',
      '067 917 51 08',
      '(067)917-51-08'
    ];

    console.log('📞 Шукаю варіанти:');
    phoneVariants.forEach(v => console.log(`   - ${v}`));
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // ====================================
    // ТАБЛИЦЯ 1: dbo.Clients
    // ====================================
    console.log('📋 ТАБЛИЦЯ: dbo.Clients');
    console.log('─────────────────────────────────────────────────────────────');
    
    const clientsResult = await sql.query`
      SELECT * FROM dbo.Clients
      WHERE PhoneNum LIKE ${`%${searchPhone}%`}
    `;
    
    if (clientsResult.recordset.length > 0) {
      console.log('✅ ЗНАЙДЕНО!');
      clientsResult.recordset.forEach(row => {
        console.log(JSON.stringify(row, null, 2));
      });
    } else {
      console.log('❌ Не знайдено');
      
      // Покажемо всі номери в таблиці
      const allClients = await sql.query`SELECT PhoneNum, Name FROM dbo.Clients`;
      console.log('\n📋 Всі клієнти в таблиці:');
      allClients.recordset.forEach(c => {
        console.log(`   ${c.PhoneNum} - ${c.Name || '(без імені)'}`);
      });
    }

    // ====================================
    // ТАБЛИЦЯ 2: dbo.Stores
    // ====================================
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 ТАБЛИЦЯ: dbo.Stores');
    console.log('─────────────────────────────────────────────────────────────');
    
    const storesResult = await sql.query`
      SELECT * FROM dbo.Stores
      WHERE Phone LIKE ${`%${searchPhone}%`}
    `;
    
    if (storesResult.recordset.length > 0) {
      console.log('✅ ЗНАЙДЕНО!');
      storesResult.recordset.forEach(row => {
        console.log(JSON.stringify(row, null, 2));
      });
    } else {
      console.log('❌ Не знайдено');
    }

    // ====================================
    // ТАБЛИЦЯ 3: dbo.QRCodes
    // ====================================
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 ТАБЛИЦЯ: dbo.QRCodes');
    console.log('─────────────────────────────────────────────────────────────');
    
    const qrResult = await sql.query`
      SELECT * FROM dbo.QRCodes
      WHERE PhoneNum LIKE ${`%${searchPhone}%`}
    `;
    
    if (qrResult.recordset.length > 0) {
      console.log('✅ ЗНАЙДЕНО!');
      qrResult.recordset.forEach(row => {
        console.log(JSON.stringify(row, null, 2));
      });
    } else {
      console.log('❌ Не знайдено (таблиця порожня)');
    }

    // ====================================
    // ТАБЛИЦЯ 4: dbo.TelegramOrders
    // ====================================
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 ТАБЛИЦЯ: dbo.TelegramOrders');
    console.log('─────────────────────────────────────────────────────────────');
    
    const telegramResult = await sql.query`
      SELECT * FROM dbo.TelegramOrders
      WHERE Phone LIKE ${`%${searchPhone}%`}
    `;
    
    if (telegramResult.recordset.length > 0) {
      console.log('✅ ЗНАЙДЕНО!');
      telegramResult.recordset.forEach(row => {
        console.log(JSON.stringify(row, null, 2));
      });
    } else {
      console.log('❌ Не знайдено');
    }

    // ====================================
    // ТАБЛИЦЯ 5: dbo.PromotionUsage
    // ====================================
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 ТАБЛИЦЯ: dbo.PromotionUsage');
    console.log('─────────────────────────────────────────────────────────────');
    
    const promoResult = await sql.query`
      SELECT * FROM dbo.PromotionUsage
      WHERE PhoneNum LIKE ${`%${searchPhone}%`}
    `;
    
    if (promoResult.recordset.length > 0) {
      console.log('✅ ЗНАЙДЕНО!');
      promoResult.recordset.forEach(row => {
        console.log(JSON.stringify(row, null, 2));
      });
    } else {
      console.log('❌ Не знайдено (таблиця порожня)');
    }

    // ====================================
    // ПЕРЕВІРКА ЧЕРЕЗ ПРОЦЕДУРУ zeus_GetCli
    // ====================================
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔧 ПРОЦЕДУРА: zeus_GetCli');
    console.log('─────────────────────────────────────────────────────────────');
    
    for (const phoneVariant of phoneVariants) {
      const cleanPhone = phoneVariant.replace(/\D/g, '');
      try {
        const procResult = await sql.query(`EXEC zeus_GetCli '${cleanPhone}'`);
        if (procResult.recordset.length > 0) {
          console.log(`✅ ЗНАЙДЕНО через процедуру з варіантом: ${phoneVariant}`);
          console.log(JSON.stringify(procResult.recordset[0], null, 2));
        }
      } catch (err) {
        // тихо пропускаємо помилки
      }
    }

    // ====================================
    // ПОШУК У ВСІХ ТЕКСТОВИХ КОЛОНКАХ
    // ====================================
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔍 ПОВНОТЕКСТОВИЙ ПОШУК У ВСІХ КОЛОНКАХ');
    console.log('─────────────────────────────────────────────────────────────');

    // Шукаємо у всіх можливих колонках
    const tables = [
      'dbo.Clients',
      'dbo.Stores', 
      'dbo.QRCodes',
      'dbo.TelegramOrders',
      'dbo.PromotionUsage'
    ];

    for (const table of tables) {
      try {
        const columnsResult = await sql.query(`
          SELECT COLUMN_NAME 
          FROM INFORMATION_SCHEMA.COLUMNS
          WHERE TABLE_NAME = '${table.split('.')[1]}'
            AND DATA_TYPE IN ('varchar', 'nvarchar', 'char', 'nchar', 'text', 'ntext')
        `);

        for (const col of columnsResult.recordset) {
          const searchResult = await sql.query(`
            SELECT TOP 1 * FROM ${table}
            WHERE CAST([${col.COLUMN_NAME}] AS NVARCHAR(MAX)) LIKE '%${searchPhone}%'
          `);

          if (searchResult.recordset.length > 0) {
            console.log(`\n✅ ЗНАЙДЕНО в ${table}.${col.COLUMN_NAME}:`);
            console.log(JSON.stringify(searchResult.recordset[0], null, 2));
          }
        }
      } catch (err) {
        // тихо пропускаємо помилки
      }
    }

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('                    ПОШУК ЗАВЕРШЕНО');
    console.log('═══════════════════════════════════════════════════════════\n');

    await sql.close();
  } catch (error) {
    console.error('\n❌ ПОМИЛКА:', error.message);
    await sql.close();
  }
}

findPhoneEverywhere();
