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

async function showClients() {
  try {
    await sql.connect(config);
    
    const result = await sql.query`SELECT TOP 10 * FROM AZIT.dbo.Clients`;
    
    console.log('\n📋 Останні 10 клієнтів в базі:\n');
    
    if (result.recordset.length > 0) {
      console.log('Колонки:', Object.keys(result.recordset[0]).join(', '));
      console.log('');
      result.recordset.forEach((c, i) => {
        console.log(`${i+1}. ${JSON.stringify(c)}`);
      });
    } else {
      console.log('Таблиця порожня');
    }
    
    console.log('');
    await sql.close();
  } catch (err) {
    console.error('❌ Помилка:', err.message);
    await sql.close();
  }
}

showClients();
