-- =========================================
-- Nova Syla Loyalty - SQL Database Setup
-- =========================================
-- Цей скрипт створює необхідні таблиці та stored procedures
-- для роботи з QR кодами в системі лояльності Nova Syla

USE AZIT;
GO

-- =========================================
-- 1. Створення таблиці для QR кодів
-- =========================================

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[QRCodes]') AND type in (N'U'))
BEGIN
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
    );
    
    PRINT 'Таблиця QRCodes створена успішно';
END
ELSE
BEGIN
    PRINT 'Таблиця QRCodes вже існує';
END
GO

-- =========================================
-- 2. Створення індексів
-- =========================================

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_QRCodes_PhoneNum')
BEGIN
    CREATE INDEX IX_QRCodes_PhoneNum ON [dbo].[QRCodes] (PhoneNum);
    PRINT 'Індекс IX_QRCodes_PhoneNum створено';
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_QRCodes_QRToken')
BEGIN
    CREATE INDEX IX_QRCodes_QRToken ON [dbo].[QRCodes] (QRToken);
    PRINT 'Індекс IX_QRCodes_QRToken створено';
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_QRCodes_ValidUntil')
BEGIN
    CREATE INDEX IX_QRCodes_ValidUntil ON [dbo].[QRCodes] (ValidUntil);
    PRINT 'Індекс IX_QRCodes_ValidUntil створено';
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_QRCodes_IsUsed')
BEGIN
    CREATE INDEX IX_QRCodes_IsUsed ON [dbo].[QRCodes] (IsUsed);
    PRINT 'Індекс IX_QRCodes_IsUsed створено';
END
GO

-- =========================================
-- 3. Stored Procedure: zeus_CreateQR
-- =========================================

IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[zeus_CreateQR]') AND type in (N'P'))
    DROP PROCEDURE [dbo].[zeus_CreateQR];
GO

CREATE PROCEDURE [dbo].[zeus_CreateQR]
    @QRToken NVARCHAR(100),
    @PhoneNum NVARCHAR(20),
    @ClientName NVARCHAR(200),
    @Balance INT,
    @ValidUntil DATETIME,
    @IsUsed BIT
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        -- Перевірка чи токен унікальний
        IF EXISTS (SELECT 1 FROM [dbo].[QRCodes] WHERE QRToken = @QRToken)
        BEGIN
            RAISERROR('QR token already exists', 16, 1);
            RETURN;
        END
        
        -- Вставка нового QR коду
        INSERT INTO [dbo].[QRCodes] (
            QRToken,
            PhoneNum,
            ClientName,
            Balance,
            CreatedAt,
            ValidUntil,
            IsUsed,
            UsedAt,
            StoreId,
            CashierId,
            TransactionAmount
        )
        VALUES (
            @QRToken,
            @PhoneNum,
            @ClientName,
            @Balance,
            GETDATE(),
            @ValidUntil,
            @IsUsed,
            NULL,
            NULL,
            NULL,
            NULL
        );
        
        -- Повернення результату
        SELECT 
            @@ROWCOUNT as RowsAffected,
            @QRToken as QRToken,
            'QR code created successfully' as Message;
    END TRY
    BEGIN CATCH
        SELECT 
            ERROR_NUMBER() AS ErrorNumber,
            ERROR_MESSAGE() AS ErrorMessage;
    END CATCH
END
GO

PRINT 'Stored Procedure zeus_CreateQR створено';
GO

-- =========================================
-- 4. Stored Procedure: zeus_ValidateQR
-- =========================================

IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[zeus_ValidateQR]') AND type in (N'P'))
    DROP PROCEDURE [dbo].[zeus_ValidateQR];
GO

CREATE PROCEDURE [dbo].[zeus_ValidateQR]
    @QRToken NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        QRToken,
        PhoneNum,
        ClientName,
        Balance,
        CreatedAt,
        ValidUntil,
        IsUsed,
        UsedAt,
        StoreId,
        CashierId,
        TransactionAmount,
        CASE 
            WHEN IsUsed = 1 THEN 0
            WHEN GETDATE() > ValidUntil THEN 0
            ELSE 1
        END as IsValid
    FROM [dbo].[QRCodes]
    WHERE QRToken = @QRToken;
END
GO

PRINT 'Stored Procedure zeus_ValidateQR створено';
GO

-- =========================================
-- 5. Stored Procedure: zeus_UseQR
-- =========================================

IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[zeus_UseQR]') AND type in (N'P'))
    DROP PROCEDURE [dbo].[zeus_UseQR];
GO

CREATE PROCEDURE [dbo].[zeus_UseQR]
    @QRToken NVARCHAR(100),
    @StoreId NVARCHAR(50),
    @CashierId NVARCHAR(50) = NULL,
    @TransactionAmount DECIMAL(18,2) = 0
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @PhoneNum NVARCHAR(20);
    DECLARE @ClientName NVARCHAR(200);
    DECLARE @IsUsed BIT;
    DECLARE @ValidUntil DATETIME;
    
    BEGIN TRY
        -- Перевірка чи існує QR код
        SELECT 
            @PhoneNum = PhoneNum,
            @ClientName = ClientName,
            @IsUsed = IsUsed,
            @ValidUntil = ValidUntil
        FROM [dbo].[QRCodes]
        WHERE QRToken = @QRToken;
        
        -- Перевірка чи знайдено QR код
        IF @PhoneNum IS NULL
        BEGIN
            SELECT 
                0 as Success,
                'QR code not found' as ErrorMessage,
                NULL as PhoneNum,
                NULL as ClientName,
                NULL as UsedAt;
            RETURN;
        END
        
        -- Перевірка чи не використаний
        IF @IsUsed = 1
        BEGIN
            SELECT 
                0 as Success,
                'QR code already used' as ErrorMessage,
                NULL as PhoneNum,
                NULL as ClientName,
                NULL as UsedAt;
            RETURN;
        END
        
        -- Перевірка чи не застарів
        IF GETDATE() > @ValidUntil
        BEGIN
            SELECT 
                0 as Success,
                'QR code expired' as ErrorMessage,
                NULL as PhoneNum,
                NULL as ClientName,
                NULL as UsedAt;
            RETURN;
        END
        
        -- Оновлення запису
        UPDATE [dbo].[QRCodes]
        SET 
            IsUsed = 1,
            UsedAt = GETDATE(),
            StoreId = @StoreId,
            CashierId = @CashierId,
            TransactionAmount = @TransactionAmount
        WHERE QRToken = @QRToken;
        
        -- Повернення результату
        SELECT 
            1 as Success,
            NULL as ErrorMessage,
            @PhoneNum as PhoneNum,
            @ClientName as ClientName,
            GETDATE() as UsedAt;
    END TRY
    BEGIN CATCH
        SELECT 
            0 as Success,
            ERROR_MESSAGE() as ErrorMessage,
            NULL as PhoneNum,
            NULL as ClientName,
            NULL as UsedAt;
    END CATCH
END
GO

PRINT 'Stored Procedure zeus_UseQR створено';
GO

-- =========================================
-- 6. Stored Procedure: zeus_GetQRHistory
-- =========================================

IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[zeus_GetQRHistory]') AND type in (N'P'))
    DROP PROCEDURE [dbo].[zeus_GetQRHistory];
GO

CREATE PROCEDURE [dbo].[zeus_GetQRHistory]
    @PhoneNum NVARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        QRToken,
        PhoneNum,
        ClientName,
        Balance,
        CreatedAt,
        ValidUntil,
        IsUsed,
        UsedAt,
        StoreId,
        CashierId,
        TransactionAmount,
        CASE 
            WHEN IsUsed = 1 THEN 'Використано'
            WHEN GETDATE() > ValidUntil THEN 'Застарів'
            ELSE 'Активний'
        END as Status
    FROM [dbo].[QRCodes]
    WHERE PhoneNum = @PhoneNum
    ORDER BY CreatedAt DESC;
END
GO

PRINT 'Stored Procedure zeus_GetQRHistory створено';
GO

-- =========================================
-- 7. Процедура очистки застарілих QR кодів
-- =========================================

IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[zeus_CleanupExpiredQR]') AND type in (N'P'))
    DROP PROCEDURE [dbo].[zeus_CleanupExpiredQR];
GO

CREATE PROCEDURE [dbo].[zeus_CleanupExpiredQR]
    @DaysToKeep INT = 30
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @DeletedCount INT;
    
    -- Видалення QR кодів старших за вказану кількість днів
    DELETE FROM [dbo].[QRCodes]
    WHERE CreatedAt < DATEADD(DAY, -@DaysToKeep, GETDATE());
    
    SET @DeletedCount = @@ROWCOUNT;
    
    SELECT 
        @DeletedCount as DeletedRecords,
        'Expired QR codes cleaned up successfully' as Message;
END
GO

PRINT 'Stored Procedure zeus_CleanupExpiredQR створено';
GO

-- =========================================
-- 8. Тестові дані (опціонально)
-- =========================================

-- Розкоментуйте для додавання тестових даних
/*
-- Тестовий QR код
EXEC [dbo].[zeus_CreateQR]
    @QRToken = 'TEST_TOKEN_123456789',
    @PhoneNum = '380685552629',
    @ClientName = 'Тестовий Клієнт',
    @Balance = 1000,
    @ValidUntil = DATEADD(MINUTE, 5, GETDATE()),
    @IsUsed = 0;

-- Перевірка створення
SELECT * FROM [dbo].[QRCodes];
*/

-- =========================================
-- Завершення
-- =========================================

PRINT '';
PRINT '=========================================';
PRINT 'Встановлення завершено успішно!';
PRINT '=========================================';
PRINT 'Створено:';
PRINT '  - Таблиця: QRCodes';
PRINT '  - Індекси: 4 шт';
PRINT '  - Stored Procedures: 5 шт';
PRINT '';
PRINT 'Для тестування використовуйте:';
PRINT '  EXEC zeus_CreateQR ...';
PRINT '  EXEC zeus_ValidateQR ...';
PRINT '  EXEC zeus_UseQR ...';
PRINT '  EXEC zeus_GetQRHistory ...';
PRINT '=========================================';
GO
