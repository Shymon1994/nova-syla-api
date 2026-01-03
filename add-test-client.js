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

async function addClient() {
  try {
    await sql.connect(config);
    
    const phone = '+380685072915';
    const name = 'Тестовий Клієнт';
    
    console.log('\n➕ Додавання клієнта в базу AZIT\n');
    console.log(`Телефон: ${phone}`);
    console.log(`Ім'я: ${name}\n`);
    
    // Додаємо клієнта
    const result = await sql.query`
      INSERT INTO AZIT.dbo.Clients (PhoneNum, Name, BonusAccount, IsAdmin, CreatedAt, UpdatedAt)
      VALUES (${phone}, ${name}, 0, 0, GETDATE(), GETDATE())
    `;
    
    console.log('✅ Клієнт успішно доданий!');
    
    // Перевіряємо
    const check = await sql.query`
      SELECT * FROM AZIT.dbo.Clients WHERE PhoneNum = ${phone}
    `;
    
    if (check.recordset.length > 0) {
      console.log('\n📋 Дані клієнта:');
      console.log(JSON.stringify(check.recordset[0], null, 2));
    }
    
    console.log('');
    await sql.close();
  } catch (err) {
    console.error('❌ Помилка:', err.message);
    await sql.close();
  }
}

addClient();
