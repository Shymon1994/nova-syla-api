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
  const phone = '+380679175108';
  console.log(`🔍 Пошук клієнта за номером: ${phone}\n`);

  try {
    const pool = await sql.connect(config);
    console.log('✅ Підключено до бази даних AZIT\n');

    // Шукаємо клієнта за різними форматами номера
    const result = await pool.request()
      .input('phone', sql.NVarChar, phone)
      .query(`
        SELECT TOP 1 *
        FROM AZIT.dbo.Clients
        WHERE Phone LIKE '%679175108%'
           OR Phone = @phone
           OR Phone = '380679175108'
           OR Phone = '0679175108'
      `);

    if (result.recordset.length > 0) {
      const client = result.recordset[0];
      console.log('✅ КЛІЄНТА ЗНАЙДЕНО:\n');
      console.log('═══════════════════════════════════════');
      console.log('Всі дані клієнта:');
      console.log(JSON.stringify(client, null, 2));
      console.log('═══════════════════════════════════════');
    } else {
      console.log('❌ Клієнта з таким номером НЕ ЗНАЙДЕНО в базі даних');
      
      // Додатковий пошук - перевірка всіх клієнтів
      const allResult = await pool.request().query(`
        SELECT COUNT(*) as Total FROM AZIT.dbo.Clients
      `);
      console.log(`\nВсього клієнтів в базі: ${allResult.recordset[0].Total}`);
    }

    await pool.close();
  } catch (error) {
    console.error('❌ Помилка:', error.message);
  }
}

checkPhone();
