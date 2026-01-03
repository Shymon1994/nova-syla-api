import sql from 'mssql';

const config: sql.config = {
  server: '10.131.10.25',
  database: 'AZIT',
  user: 'zeus',
  password: 'zeus',
  options: {
    encrypt: false,
    trustServerCertificate: true
  }
};

interface ClientData {
  clientId: string;
  phone: string;
  name: string;
  balance: number;
  level: string;
  email?: string;
  city?: string;
  registeredAt?: Date;
}

async function testLogin(phone: string) {
  let pool: sql.ConnectionPool | null = null;
  try {
    pool = await sql.connect(config);
    
    const cleanPhone = phone.replace(/\D/g, '');
    if (!cleanPhone.startsWith('380')) {
      throw new Error('Неправильний формат номера');
    }
    const formattedPhone = '+' + cleanPhone;

    const request = new sql.Request();
    request.input('PhoneNum', sql.VarChar(20), formattedPhone);
    const result = await request.execute('zeus_GetCli');

    console.log('═══════════════════════════════════════');
    console.log(`📞 Тест для номера: ${formattedPhone}`);
    console.log('═══════════════════════════════════════\n');

    console.log(`📦 Отримано записів: ${result.recordset.length}\n`);
    
    result.recordset.forEach((record: any, idx: number) => {
      console.log(`Запис ${idx + 1}:`);
      console.log(`  RECID: ${record.RECID}`);
      console.log(`  NAME: ${record.NAME}`);
      console.log(`  F7: ${record.F7}`);
      console.log('');
    });

    if (result.recordset && result.recordset.length > 0) {
      // Фільтруємо записи: беремо тільки з валідним RECID
      const validRecords = result.recordset.filter((r: any) => r.RECID != null && r.F7 != null);
      
      console.log(`✅ Валідних записів: ${validRecords.length}\n`);
      
      if (validRecords.length === 0) {
        console.log('❌ Немає валідних записів');
        return;
      }
      
      // Вибираємо найкращий запис: без дужок у F7, або з найменшою довжиною
      const bestRecord = validRecords.reduce((best: any, current: any) => {
        const bestF7 = best.F7 || '';
        const currentF7 = current.F7 || '';
        
        // Якщо поточний запис не має дужок, а найкращий має - беремо поточний
        if (!currentF7.includes('(') && bestF7.includes('(')) {
          return current;
        }
        
        // Якщо обидва мають дужки або обидва без - беремо коротший
        if (currentF7.length < bestF7.length && !currentF7.includes('(')) {
          return current;
        }
        
        return best;
      });
      
      console.log('🎯 Обраний найкращий запис:');
      console.log(`  RECID: ${bestRecord.RECID}`);
      console.log(`  NAME: ${bestRecord.NAME}`);
      console.log(`  F7: ${bestRecord.F7}\n`);
      
      const record = bestRecord;
      
      // Отримуємо ім'я з різних можливих полів
      let clientName = record.Name || record.ClientName || record.FullName || record.F7 || record.NAME;
      
      // Якщо в імені є "(Менеджер)" або інші дужки - видаляємо їх
      if (clientName && typeof clientName === 'string') {
        clientName = clientName.replace(/\s*\([^)]*\)\s*/g, '').trim();
      }
      
      const clientData: ClientData = {
        clientId: record.ClientID || record.Id || record.ID || record.RECID,
        phone: formattedPhone,
        name: clientName,
        balance: record.Balance || record.BonusBalance || 0,
        level: record.Level || record.ClientLevel || 'Бронза',
        email: record.Email,
        city: record.City || record.CityName,
        registeredAt: record.RegisteredAt || record.CreatedAt,
      };

      console.log('📋 Фінальні дані клієнта:');
      console.log(JSON.stringify(clientData, null, 2));
      console.log('');
    } else {
      console.log('❌ Клієнта не знайдено');
    }

    if (pool) {
      await pool.close();
    }
    console.log('✅ Тест завершено');
    
  } catch (error: any) {
    console.error('❌ Помилка:', error.message);
  }
}

testLogin('+380960608968');
