import { getConnection } from '../config/database';

async function createClientsTable() {
  try {
    console.log('📊 Створюю таблицю Clients...');
    
    const pool = await getConnection();
    
    // Створити таблицю Clients
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Clients]') AND type in (N'U'))
      BEGIN
        CREATE TABLE [dbo].[Clients] (
          [PhoneNum] NVARCHAR(20) PRIMARY KEY,
          [Name] NVARCHAR(100) NULL,
          [Email] NVARCHAR(100) NULL,
          [City] NVARCHAR(100) NULL,
          [BonusAccount] INT DEFAULT 0,
          [IsAdmin] BIT DEFAULT 0,
          [CreatedAt] DATETIME DEFAULT GETDATE(),
          [UpdatedAt] DATETIME DEFAULT GETDATE()
        );
        PRINT '✅ Таблиця Clients створена';
      END
      ELSE
      BEGIN
        -- Додати поля якщо таблиця вже існує
        IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Clients]') AND name = 'Name')
          ALTER TABLE [dbo].[Clients] ADD [Name] NVARCHAR(100) NULL;
        
        IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Clients]') AND name = 'Email')
          ALTER TABLE [dbo].[Clients] ADD [Email] NVARCHAR(100) NULL;
        
        IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Clients]') AND name = 'City')
          ALTER TABLE [dbo].[Clients] ADD [City] NVARCHAR(100) NULL;
        
        PRINT '✅ Поля додано до існуючої таблиці';
      END
    `);
    
    console.log('✅ Таблиця Clients готова');
    
    // Створити stored procedure для оновлення профілю
    console.log('📝 Створюю stored procedure zeus_UpdateClientProfile...');
    
    await pool.request().query(`
      IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[zeus_UpdateClientProfile]') AND type in (N'P', N'PC'))
        DROP PROCEDURE [dbo].[zeus_UpdateClientProfile]
    `);
    
    await pool.request().query(`
      CREATE PROCEDURE [dbo].[zeus_UpdateClientProfile]
          @PhoneNum NVARCHAR(20),
          @Name NVARCHAR(100) = NULL,
          @Email NVARCHAR(100) = NULL,
          @City NVARCHAR(100) = NULL
      AS
      BEGIN
          SET NOCOUNT ON;
          
          -- Якщо клієнта немає, створити його
          IF NOT EXISTS (SELECT 1 FROM [dbo].[Clients] WHERE PhoneNum = @PhoneNum)
          BEGIN
              INSERT INTO [dbo].[Clients] (PhoneNum, Name, Email, City, BonusAccount, IsAdmin)
              VALUES (@PhoneNum, @Name, @Email, @City, 0, 0);
          END
          ELSE
          BEGIN
              -- Оновити дані
              UPDATE [dbo].[Clients]
              SET 
                  Name = COALESCE(@Name, Name),
                  Email = COALESCE(@Email, Email),
                  City = COALESCE(@City, City),
                  UpdatedAt = GETDATE()
              WHERE PhoneNum = @PhoneNum;
          END
          
          -- Повернути оновлені дані
          SELECT 
              PhoneNum,
              Name,
              Email,
              City,
              BonusAccount,
              ISNULL(IsAdmin, 0) as IsAdmin
          FROM [dbo].[Clients]
          WHERE PhoneNum = @PhoneNum;
      END
    `);
    
    console.log('✅ Stored procedure створено успішно');
    
    // Додати тестового користувача
    console.log('👤 Додаю тестового користувача...');
    
    await pool.request()
      .input('PhoneNum', '+380960608968')
      .input('Name', 'Шимон Василь Васильович')
      .input('Email', null)
      .input('City', 'Довге')
      .execute('zeus_UpdateClientProfile');
    
    console.log('✅ Тестовий користувач додано');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Помилка:', error);
    process.exit(1);
  }
}

createClientsTable();
