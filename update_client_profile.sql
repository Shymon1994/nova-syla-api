-- Додати поля Name та Email до таблиці Clients якщо їх немає
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

-- Створити або оновити stored procedure для оновлення профілю
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[AZIT].[zeus_UpdateClientProfile]') AND type in (N'P', N'PC'))
DROP PROCEDURE AZIT.zeus_UpdateClientProfile
GO

CREATE PROCEDURE AZIT.zeus_UpdateClientProfile
    @PhoneNum NVARCHAR(20),
    @Name NVARCHAR(100) = NULL,
    @Email NVARCHAR(100) = NULL,
    @City NVARCHAR(100) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Оновити дані клієнта
    UPDATE AZIT.Clients
    SET 
        Name = COALESCE(@Name, Name),
        Email = COALESCE(@Email, Email),
        City = COALESCE(@City, City)
    WHERE PhoneNum = @PhoneNum;
    
    -- Повернути оновлені дані
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
GO

PRINT '✅ Stored procedure zeus_UpdateClientProfile створено успішно';
