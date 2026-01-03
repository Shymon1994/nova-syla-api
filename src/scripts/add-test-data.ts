/**
 * Add Test Data Script
 * Додає тестові дані в таблицю QRCodes для перевірки функціоналу
 */
import { getConnection, closeConnection } from '../config/database';

async function addTestData() {
  console.log('🚀 Додавання тестових даних...\n');
  
  try {
    const pool = await getConnection();
    console.log('✅ Підключено до SQL Server\n');
    
    const testUsers = [
      {
        phone: '+380960608968',
        name: 'Тестовий Користувач 1',
        balance: 150,
        transactionAmount: 1500.00
      },
      {
        phone: '+380501234567',
        name: 'Іван Петренко',
        balance: 250,
        transactionAmount: 2500.50
      },
      {
        phone: '+380671234567',
        name: 'Марія Коваленко',
        balance: 320,
        transactionAmount: 3200.75
      },
      {
        phone: '+380931234567',
        name: 'Олександр Шевченко',
        balance: 180,
        transactionAmount: 1800.25
      },
      {
        phone: '+380441234567',
        name: 'Наталія Бондаренко',
        balance: 420,
        transactionAmount: 4200.00
      }
    ];
    
    console.log(`📝 Додавання ${testUsers.length} тестових користувачів...\n`);
    
    for (const user of testUsers) {
      try {
        // Генеруємо унікальний токен
        const qrToken = `TEST_${user.phone}_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        
        // Створюємо QR код через stored procedure
        const result = await pool.request()
          .input('QRToken', qrToken)
          .input('PhoneNum', user.phone)
          .input('ClientName', user.name)
          .input('Balance', user.balance)
          .input('ValidUntil', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)) // 30 днів
          .input('IsUsed', false)
          .execute('zeus_CreateQR');
        
        console.log(`✓ ${user.name} (${user.phone})`);
        
        // Додаємо транзакцію (імітуємо покупку)
        if (user.transactionAmount > 0) {
          await pool.request().query(`
            UPDATE AZIT.dbo.QRCodes
            SET 
              TransactionAmount = ${user.transactionAmount},
              IsUsed = 1,
              UsedAt = GETDATE(),
              StoreId = 'STORE_001',
              CashierId = 'CASHIER_${Math.floor(Math.random() * 5) + 1}'
            WHERE QRToken = '${qrToken}'
          `);
          console.log(`  💰 Додано транзакцію: ${user.transactionAmount} грн`);
        }
        
        // Додаємо ще один активний QR код (не використаний)
        const activeToken = `ACTIVE_${user.phone}_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        await pool.request()
          .input('QRToken', activeToken)
          .input('PhoneNum', user.phone)
          .input('ClientName', user.name)
          .input('Balance', user.balance)
          .input('ValidUntil', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)) // 7 днів
          .input('IsUsed', false)
          .execute('zeus_CreateQR');
        
        console.log(`  ✓ Додано активний QR код\n`);
        
      } catch (err: any) {
        console.error(`❌ Помилка для ${user.name}:`, err.message);
      }
    }
    
    // Перевіряємо результат
    console.log('\n📊 Статистика після додавання:\n');
    
    const stats = await pool.request().query(`
      SELECT 
        COUNT(DISTINCT PhoneNum) as totalUsers,
        COUNT(*) as totalQRCodes,
        COUNT(CASE WHEN IsUsed = 1 THEN 1 END) as usedQRCodes,
        COUNT(CASE WHEN IsUsed = 0 THEN 1 END) as activeQRCodes,
        SUM(CASE WHEN TransactionAmount IS NOT NULL THEN TransactionAmount ELSE 0 END) as totalRevenue
      FROM AZIT.dbo.QRCodes
    `);
    
    const stat = stats.recordset[0];
    console.log(`👥 Користувачів: ${stat.totalUsers}`);
    console.log(`🎫 Всього QR кодів: ${stat.totalQRCodes}`);
    console.log(`✅ Використано: ${stat.usedQRCodes}`);
    console.log(`🟢 Активних: ${stat.activeQRCodes}`);
    console.log(`💰 Загальна сума: ${stat.totalRevenue} грн`);
    
    // Показуємо останні транзакції
    console.log('\n📝 Останні транзакції:\n');
    const transactions = await pool.request().query(`
      SELECT TOP 5
        ClientName,
        PhoneNum,
        TransactionAmount,
        UsedAt,
        StoreId
      FROM AZIT.dbo.QRCodes
      WHERE TransactionAmount IS NOT NULL
      ORDER BY UsedAt DESC
    `);
    
    transactions.recordset.forEach((t: any) => {
      console.log(`  ${t.ClientName} - ${t.TransactionAmount} грн (${t.StoreId})`);
    });
    
  } catch (error: any) {
    console.error('❌ Помилка:', error.message);
    process.exit(1);
  } finally {
    await closeConnection();
    console.log('\n🔌 З\'єднання закрито');
  }
}

// Запускаємо скрипт
addTestData()
  .then(() => {
    console.log('\n✨ Готово!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('💥 Фатальна помилка:', err);
    process.exit(1);
  });
