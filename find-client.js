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

async function findClientByPhone() {
  const phone = '+380679175108';
  console.log(`🔍 Пошук клієнта за номером: ${phone}\n`);

  try {
    await sql.connect(config);
    console.log('✅ Підключено до бази даних AZIT\n');

    // Спочатку подивимось на таблиці
    console.log('📋 Перевірка структури бази:\n');
    
    const tablesResult = await sql.query`
      SELECT TABLE_SCHEMA, TABLE_NAME
      FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_TYPE = 'BASE TABLE' 
        AND (TABLE_NAME LIKE '%Client%' OR TABLE_NAME LIKE '%Cli%')
      ORDER BY TABLE_SCHEMA, TABLE_NAME
    `;
    
    console.log('Таблиці з клієнтами:');
    tablesResult.recordset.forEach(t => {
      console.log(`  - ${t.TABLE_SCHEMA}.${t.TABLE_NAME}`);
    });

    // Спробуємо викликати процедуру zeus_GetCli
    console.log('\n🔍 Пошук через процедуру zeus_GetCli:\n');
    
    try {
      const result = await sql.query`EXEC zeus_GetCli ${phone.replace(/\D/g, '')}`;
      
      if (result.recordset.length > 0) {
        const client = result.recordset[0];
        console.log('✅ КЛІЄНТА ЗНАЙДЕНО:\n');
        console.log('═══════════════════════════════════════');
        console.log(JSON.stringify(client, null, 2));
        console.log('═══════════════════════════════════════');
      } else {
        console.log('❌ Клієнта НЕ знайдено');
      }
    } catch (err) {
      console.log(`❌ Помилка виклику процедури: ${err.message}`);
      
      // Якщо процедура не працює, спробуємо пряме запитання до таблиці
      console.log('\n🔍 Спроба прямого запиту до таблиць:\n');
      
      for (const table of tablesResult.recordset) {
        try {
          console.log(`Пошук в ${table.TABLE_SCHEMA}.${table.TABLE_NAME}...`);
          const directResult = await sql.query(`SELECT TOP 5 * FROM ${table.TABLE_SCHEMA}.${table.TABLE_NAME}`);
          console.log(`  Знайдено записів: ${directResult.recordset.length}`);
          if (directResult.recordset.length > 0) {
            console.log(`  Колонки: ${Object.keys(directResult.recordset[0]).join(', ')}`);
          }
        } catch (tableErr) {
          console.log(`  ❌ Помилка: ${tableErr.message}`);
        }
      }
    }

    await sql.close();
  } catch (error) {
    console.error('❌ Помилка:', error.message);
    await sql.close();
  }
}

findClientByPhone();
