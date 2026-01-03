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

async function showLastClients() {
  try {
    await sql.connect(config);
    
    const result = await sql.query`SELECT TOP 10 * FROM AZIT.dbo.Clients ORDER BY ID DESC`;
    
    console.log('\n📋 Останні 10 клієнтів в базі:\n');
    result.recordset.forEach(c => {
      console.log(`ID: ${c.ID}, Phone: ${c.PhoneNum}, Name: ${c.FirstName || ''} ${c.LastName || ''}`);
    });
    
    console.log('');
    await sql.close();
  } catch (err) {
    console.error('❌ Помилка:', err.message);
    await sql.close();
  }
}

showLastClients();
