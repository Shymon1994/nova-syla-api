/**
 * Create QRCodes Table Script
 * Створює таблицю QRCodes в базі даних AZIT
 */
import { getConnection, closeConnection } from '../config/database';

async function createQRCodesTable() {
  console.log('🚀 Створення таблиці QRCodes...\n');
  
  try {
    const pool = await getConnection();
    console.log('✅ Підключено до SQL Server\n');
    
    // Перевіряємо чи таблиця вже існує
    console.log('🔍 Перевірка існування таблиці...');
    const checkTable = await pool.request().query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_NAME = 'QRCodes'
    `);
    
    if (checkTable.recordset.length > 0) {
      console.log('⚠️  Таблиця QRCodes вже існує!\n');
      
      // Показуємо структуру
      const columns = await pool.request().query(`
        SELECT 
          COLUMN_NAME,
          DATA_TYPE,
          CHARACTER_MAXIMUM_LENGTH,
          IS_NULLABLE
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_NAME = 'QRCodes'
        ORDER BY ORDINAL_POSITION
      `);
      
      console.log('📋 Структура таблиці:');
      columns.recordset.forEach((col: any) => {
        console.log(`  - ${col.COLUMN_NAME}: ${col.DATA_TYPE}${col.CHARACTER_MAXIMUM_LENGTH ? '(' + col.CHARACTER_MAXIMUM_LENGTH + ')' : ''} ${col.IS_NULLABLE === 'NO' ? 'NOT NULL' : 'NULL'}`);
      });
      
      return;
    }
    
    // Створюємо таблицю
    console.log('📝 Створення таблиці QRCodes...');
    await pool.request().query(`
      CREATE TABLE [dbo].[QRCodes] (
        [Id] INT IDENTITY(1,1) PRIMARY KEY,
        [QRToken] NVARCHAR(100) NOT NULL UNIQUE,
        [PhoneNum] NVARCHAR(20) NOT NULL,
        [ClientName] NVARCHAR(200),
        [Balance] INT DEFAULT 0,
        [CreatedAt] DATETIME NOT NULL DEFAULT GETDATE(),
        [ValidUntil] DATETIME NOT NULL,
        [IsUsed] BIT NOT NULL DEFAULT 0,
        [UsedAt] DATETIME NULL,
        [StoreId] NVARCHAR(50) NULL,
        [CashierId] NVARCHAR(50) NULL,
        [TransactionAmount] DECIMAL(18,2) NULL,
        
        CONSTRAINT CK_QRCodes_ValidUntil CHECK (ValidUntil > CreatedAt)
      )
    `);
    console.log('✅ Таблиця QRCodes створена!\n');
    
    // Створюємо індекси
    console.log('📊 Створення індексів...');
    
    await pool.request().query(`
      CREATE INDEX IX_QRCodes_PhoneNum ON [dbo].[QRCodes] (PhoneNum)
    `);
    console.log('✓ Індекс IX_QRCodes_PhoneNum');
    
    await pool.request().query(`
      CREATE INDEX IX_QRCodes_QRToken ON [dbo].[QRCodes] (QRToken)
    `);
    console.log('✓ Індекс IX_QRCodes_QRToken');
    
    await pool.request().query(`
      CREATE INDEX IX_QRCodes_ValidUntil ON [dbo].[QRCodes] (ValidUntil)
    `);
    console.log('✓ Індекс IX_QRCodes_ValidUntil');
    
    await pool.request().query(`
      CREATE INDEX IX_QRCodes_IsUsed ON [dbo].[QRCodes] (IsUsed)
    `);
    console.log('✓ Індекс IX_QRCodes_IsUsed\n');
    
    // Перевіряємо результат
    const verify = await pool.request().query(`
      SELECT 
        COUNT(*) as total,
        (SELECT COUNT(*) FROM sys.indexes WHERE object_id = OBJECT_ID('QRCodes')) as index_count
      FROM AZIT.dbo.QRCodes
    `);
    
    console.log('📊 Результат:');
    console.log(`  ✓ Таблиця створена`);
    console.log(`  ✓ Записів: ${verify.recordset[0].total}`);
    console.log(`  ✓ Індексів: ${verify.recordset[0].index_count}`);
    
  } catch (error: any) {
    console.error('❌ Помилка:', error.message);
    process.exit(1);
  } finally {
    await closeConnection();
    console.log('\n🔌 З\'єднання закрито');
  }
}

// Запускаємо скрипт
createQRCodesTable()
  .then(() => {
    console.log('\n✨ Готово!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('💥 Фатальна помилка:', err);
    process.exit(1);
  });
