-- Створення stored procedure zeus_GetQRHistory
USE AZIT;
GO

-- Видалення якщо існує
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[zeus_GetQRHistory]') AND type in (N'P'))
    DROP PROCEDURE [dbo].[zeus_GetQRHistory];
GO

-- Створення процедури
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

PRINT 'Stored Procedure zeus_GetQRHistory створено успішно!';
GO
