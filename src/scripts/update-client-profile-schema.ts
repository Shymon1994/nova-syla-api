import sql from 'mssql';
import { getConnection } from '../config/database';

async function updateClientProfile() {
  try {
    console.log('📊 Додаю поля Name, Email, City до таблиці Clients...');
    
    const pool = await getConnection();
    
    // Додати поля якщо їх немає
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[AZIT].[Clients]') AND name = 'Name')
      BEGIN
          ALTER TABLE AZIT.Clients ADD Name NVARCHAR(100) NULL;
      END
      
      IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[AZIT].[Clients]') AND name = 'Email')
      BEGIN
          ALTER TABLE AZIT.Clients ADD Email NVARCHAR(100) NULL;
      END
      
      IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[AZIT].[Clients]') AND name = 'City')
      BEGIN
          ALTER TABLE AZIT.Clients ADD City NVARCHAR(100) NULL;
      END
    `);
    
    console.log('✅ Поля додано');
    
    // Створити stored procedure
    console.log('📝 Створюю stored procedure zeus_UpdateClientProfile...');
    
    await pool.request().query(`
      IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[AZIT].[zeus_UpdateClientProfile]') AND type in (N'P', N'PC'))
      DROP PROCEDURE AZIT.zeus_UpdateClientProfile
    `);
    
    await pool.request().query(`
      CREATE PROCEDURE AZIT.zeus_UpdateClientProfile
          @PhoneNum NVARCHAR(20),
          @Name NVARCHAR(100) = NULL,
          @Email NVARCHAR(100) = NULL,
          @City NVARCHAR(100) = NULL
      AS
      BEGIN
          SET NOCOUNT ON;
          
          UPDATE AZIT.Clients
          SET 
              Name = COALESCE(@Name, Name),
              Email = COALESCE(@Email, Email),
              City = COALESCE(@City, City)
          WHERE PhoneNum = @PhoneNum;
          
          SELECT 
              PhoneNum,
              Name,
              Email,
              City,
              BonusAccount,
              ISNULL(IsAdmin, 0) as IsAdmin
          FROM AZIT.Clients
          WHERE PhoneNum = @PhoneNum;
      END
    `);
    
    console.log('✅ Stored procedure створено успішно');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Помилка:', error);
    process.exit(1);
  }
}

updateClientProfile();
