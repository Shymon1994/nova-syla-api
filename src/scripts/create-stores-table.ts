/**
 * Create Stores Table Script
 * Створює таблицю Stores для реальних даних магазинів
 */
import { getConnection, closeConnection } from '../config/database';

async function createStoresTable() {
  console.log('🚀 Створення таблиці Stores...\n');
  
  try {
    const pool = await getConnection();
    console.log('✅ Підключено до SQL Server\n');
    
    // Перевіряємо чи таблиця вже існує
    console.log('🔍 Перевірка існування таблиці...');
    const checkTable = await pool.request().query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_NAME = 'Stores'
    `);
    
    if (checkTable.recordset.length > 0) {
      console.log('⚠️  Таблиця Stores вже існує!\n');
      
      // Показуємо існуючі магазини
      const stores = await pool.request().query(`
        SELECT * FROM AZIT.dbo.Stores ORDER BY CreatedAt DESC
      `);
      
      console.log(`📋 Існуючих магазинів: ${stores.recordset.length}\n`);
      stores.recordset.forEach((store: any) => {
        console.log(`  ${store.StoreId}: ${store.StoreName}`);
        console.log(`    ${store.Address || 'Без адреси'}`);
        console.log(`    Статус: ${store.IsActive ? 'Активний' : 'Неактивний'}\n`);
      });
      
      return;
    }
    
    // Створюємо таблицю
    console.log('📝 Створення таблиці Stores...');
    await pool.request().query(`
      CREATE TABLE [dbo].[Stores] (
        [Id] INT IDENTITY(1,1) PRIMARY KEY,
        [StoreId] NVARCHAR(50) NOT NULL UNIQUE,
        [StoreName] NVARCHAR(200) NOT NULL,
        [StoreType] NVARCHAR(50) NOT NULL, -- 'gas_station', 'shop', 'cafe', etc.
        [Address] NVARCHAR(500),
        [City] NVARCHAR(100),
        [Region] NVARCHAR(100),
        [Phone] NVARCHAR(20),
        [WorkingHours] NVARCHAR(200),
        [Latitude] DECIMAL(10, 8),
        [Longitude] DECIMAL(11, 8),
        [IsActive] BIT NOT NULL DEFAULT 1,
        [CreatedAt] DATETIME NOT NULL DEFAULT GETDATE(),
        [UpdatedAt] DATETIME NOT NULL DEFAULT GETDATE(),
        
        CONSTRAINT CK_Stores_StoreType CHECK (StoreType IN ('gas_station', 'shop', 'cafe', 'service'))
      )
    `);
    console.log('✅ Таблиця Stores створена!\n');
    
    // Створюємо індекси
    console.log('📊 Створення індексів...');
    
    await pool.request().query(`
      CREATE UNIQUE INDEX IX_Stores_StoreId ON [dbo].[Stores] (StoreId)
    `);
    console.log('✓ Індекс IX_Stores_StoreId');
    
    await pool.request().query(`
      CREATE INDEX IX_Stores_City ON [dbo].[Stores] (City)
    `);
    console.log('✓ Індекс IX_Stores_City');
    
    await pool.request().query(`
      CREATE INDEX IX_Stores_IsActive ON [dbo].[Stores] (IsActive)
    `);
    console.log('✓ Індекс IX_Stores_IsActive\n');
    
    // Перевіряємо результат
    const verify = await pool.request().query(`
      SELECT COUNT(*) as total
      FROM AZIT.dbo.Stores
    `);
    
    console.log('📊 Результат:');
    console.log(`  ✓ Таблиця створена`);
    console.log(`  ✓ Магазинів: ${verify.recordset[0].total}`);
    console.log(`  ✓ Індексів: 3`);
    
    console.log('\n💡 Тепер адміністратор може додавати магазини через адмін панель');
    
  } catch (error: any) {
    console.error('❌ Помилка:', error.message);
    process.exit(1);
  } finally {
    await closeConnection();
    console.log('\n🔌 З\'єднання закрито');
  }
}

// Запускаємо скрипт
createStoresTable()
  .then(() => {
    console.log('\n✨ Готово!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('💥 Фатальна помилка:', err);
    process.exit(1);
  });
