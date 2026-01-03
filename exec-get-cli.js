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

async function executeGetCli() {
  console.log('🔍 Виконую: EXEC AZIT.dbo.zeus_GetCli \'+380679175108\'\n');
  console.log('═══════════════════════════════════════════════════════════\n');

  try {
    await sql.connect(config);
    console.log('✅ Підключено до бази AZIT\n');

    const result = await sql.query`EXEC AZIT.dbo.zeus_GetCli '+380679175108'`;
    
    console.log(`📊 Результат виконання процедури:\n`);
    console.log(`Кількість записів: ${result.recordset.length}\n`);

    if (result.recordset.length > 0) {
      console.log('✅ КЛІЄНТА ЗНАЙДЕНО:\n');
      console.log('─────────────────────────────────────────────────────────────');
      result.recordset.forEach((row, idx) => {
        console.log(`\nЗапис #${idx + 1}:`);
        console.log(JSON.stringify(row, null, 2));
      });
      console.log('─────────────────────────────────────────────────────────────');
    } else {
      console.log('❌ Клієнта НЕ знайдено (процедура повернула 0 записів)');
    }

    console.log('\n═══════════════════════════════════════════════════════════\n');

    await sql.close();
  } catch (error) {
    console.error('❌ ПОМИЛКА:', error.message);
    console.error('\nДеталі:', error);
    await sql.close();
  }
}

executeGetCli();
