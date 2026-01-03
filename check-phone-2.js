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

async function checkPhone() {
  const phone = '+380679508133';
  console.log(`🔍 Перевірка номера: ${phone}\n`);
  console.log('═══════════════════════════════════════════════════════════\n');

  try {
    await sql.connect(config);
    console.log('✅ Підключено до бази AZIT\n');

    const result = await sql.query`EXEC AZIT.dbo.zeus_GetCli ${phone}`;
    
    console.log(`📊 Кількість записів: ${result.recordset.length}\n`);

    if (result.recordset.length > 0) {
      console.log('✅ КЛІЄНТА ЗНАЙДЕНО:\n');
      console.log('─────────────────────────────────────────────────────────────');
      result.recordset.forEach((row, idx) => {
        console.log(`\nЗапис #${idx + 1}:`);
        console.log(`  RECID: ${row.RECID}`);
        console.log(`  NAME: ${row.NAME}`);
        console.log(`  F7: ${row.F7}`);
      });
      console.log('─────────────────────────────────────────────────────────────');
    } else {
      console.log('❌ Клієнта НЕ знайдено');
    }

    console.log('\n═══════════════════════════════════════════════════════════\n');

    await sql.close();
  } catch (error) {
    console.error('❌ Помилка:', error.message);
    await sql.close();
  }
}

checkPhone();
