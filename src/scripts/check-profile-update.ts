import { getConnection } from '../config/database';
import sql from 'mssql';

async function checkProfileUpdate() {
  try {
    console.log('🔍 Перевірка оновленого профілю...\n');
    
    const pool = await getConnection();
    const result = await pool.request()
      .input('PhoneNum', sql.NVarChar, '+380960608968')
      .query('SELECT PhoneNum, Name, Email, City, BonusAccount, IsAdmin, CreatedAt, UpdatedAt FROM dbo.Clients WHERE PhoneNum = @PhoneNum');
    
    if (result.recordset && result.recordset.length > 0) {
      const client = result.recordset[0];
      console.log('✅ Клієнт знайдено в таблиці Clients:\n');
      console.log(`📞 Телефон: ${client.PhoneNum}`);
      console.log(`👤 Ім'я: ${client.Name}`);
      console.log(`📧 Email: ${client.Email}`);
      console.log(`🏙️  Місто: ${client.City}`);
      console.log(`💰 Баланс: ${client.BonusAccount}`);
      console.log(`👑 Адмін: ${client.IsAdmin ? 'Так' : 'Ні'}`);
      console.log(`📅 Створено: ${client.CreatedAt}`);
      console.log(`📅 Оновлено: ${client.UpdatedAt}`);
    } else {
      console.log('❌ Клієнт не знайдено');
    }
    
    await pool.close();
  } catch (error) {
    console.error('❌ Помилка:', error);
  }
}

checkProfileUpdate();
