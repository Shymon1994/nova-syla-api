const sql = require('mssql');

const config = {
  server: '10.131.10.25',
  database: 'AZIT',
  user: 'zeus',
  password: 'zeus',
  options: {
    encrypt: false,
    trustServerCertificate: true
  }
};

async function searchPhone() {
  try {
    await sql.connect(config);
    console.log('\n🔍 Пошук номера +380685072915 в різних форматах:\n');

    // 1. LIKE пошук
    const result1 = await sql.query`SELECT TOP 1 * FROM AZIT.dbo.Clients WHERE PhoneNum LIKE '%685072915%'`;
    console.log('1. LIKE %685072915%:');
    if (result1.recordset.length > 0) {
      console.log('   ✅ ЗНАЙДЕНО:', result1.recordset[0].PhoneNum, '-', result1.recordset[0].FirstName || '', result1.recordset[0].LastName || '');
      console.log('   ID:', result1.recordset[0].ID);
    } else {
      console.log('   ❌ НЕ ЗНАЙДЕНО');
    }

    // 2. З +
    const result2 = await sql.query`SELECT TOP 1 * FROM AZIT.dbo.Clients WHERE PhoneNum = '+380685072915'`;
    console.log('2. = +380685072915:');
    console.log(result2.recordset.length > 0 ? '   ✅ ЗНАЙДЕНО' : '   ❌ НЕ ЗНАЙДЕНО');

    // 3. Без + з 0
    const result3 = await sql.query`SELECT TOP 1 * FROM AZIT.dbo.Clients WHERE PhoneNum = '0685072915'`;
    console.log('3. = 0685072915:');
    console.log(result3.recordset.length > 0 ? '   ✅ ЗНАЙДЕНО' : '   ❌ НЕ ЗНАЙДЕНО');

    // 4. Без + з 380
    const result4 = await sql.query`SELECT TOP 1 * FROM AZIT.dbo.Clients WHERE PhoneNum = '380685072915'`;
    console.log('4. = 380685072915:');
    console.log(result4.recordset.length > 0 ? '   ✅ ЗНАЙДЕНО' : '   ❌ НЕ ЗНАЙДЕНО');

    console.log('');
    await sql.close();
  } catch (err) {
    console.error('❌ Помилка:', err.message);
    await sql.close();
  }
}

searchPhone();
