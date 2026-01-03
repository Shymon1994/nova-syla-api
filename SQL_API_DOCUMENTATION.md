# API для інтеграції з АБ Офіс - Nova Syla Loyalty

## Загальна інформація

**Base URL:** `http://localhost:3001/api`

**Формат даних:** JSON

**Кодування:** UTF-8

## Автентифікація

Наразі API не потребує автентифікації для тестування. В продакшені буде додано API ключі.

---

## Endpoints для роботи з QR кодами

### 1. Генерація QR коду

**Endpoint:** `POST /api/qr/generate`

**Опис:** Генерує новий QR код для клієнта який буде діяти 5 хвилин

**Request Body:**
```json
{
  "phone": "+380685552629",
  "clientName": "Іванов Іван Іванович",
  "balance": 1250
}
```

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "qrToken": "a3b5c7d9e1f2g3h4i5j6k7l8m9n0o1p2q3r4s5t6u7v8w9x0y1z2a3b4c5d6e7f8",
    "phone": "380685552629",
    "clientName": "Іванов Іван Іванович",
    "balance": 1250,
    "validUntil": "2025-12-20T12:05:00.000Z",
    "timestamp": 1734696000000
  }
}
```

**Параметри:**
- `phone` (обов'язково) - номер телефону клієнта
- `clientName` (опціонально) - ПІБ клієнта
- `balance` (опціонально) - баланс балів лояльності

---

### 2. Перевірка валідності QR коду

**Endpoint:** `GET /api/qr/validate/:qrToken`

**Опис:** Перевіряє чи QR код ще дійсний (не застарів і не використаний)

**Request:**
```
GET /api/qr/validate/a3b5c7d9e1f2g3h4i5j6k7l8m9n0o1p2q3r4s5t6u7v8w9x0y1z2a3b4c5d6e7f8
```

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "isValid": true,
    "phone": "380685552629",
    "clientName": "Іванов Іван Іванович",
    "balance": 1250,
    "validUntil": "2025-12-20T12:05:00.000Z",
    "isUsed": false,
    "usedAt": null
  }
}
```

**Response (Expired/Used):**
```json
{
  "success": true,
  "data": {
    "isValid": false,
    "phone": "380685552629",
    "clientName": "Іванов Іван Іванович",
    "balance": 1250,
    "validUntil": "2025-12-20T12:05:00.000Z",
    "isUsed": true,
    "usedAt": "2025-12-20T12:03:45.000Z"
  }
}
```

---

### 3. Використання QR коду (для АБ Офіс)

**Endpoint:** `POST /api/qr/use`

**Опис:** Позначає QR код як використаний при оплаті/нарахуванні балів в магазині

**Request Body:**
```json
{
  "qrToken": "a3b5c7d9e1f2g3h4i5j6k7l8m9n0o1p2q3r4s5t6u7v8w9x0y1z2a3b4c5d6e7f8",
  "storeId": "STORE_001",
  "cashierId": "CASHIER_123",
  "transactionAmount": 1500.50
}
```

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "message": "QR code used successfully",
    "phone": "380685552629",
    "clientName": "Іванов Іван Іванович",
    "usedAt": "2025-12-20T12:03:45.000Z"
  }
}
```

**Response (Error - Already Used):**
```json
{
  "success": false,
  "error": "QR code already used"
}
```

**Response (Error - Expired):**
```json
{
  "success": false,
  "error": "QR code expired"
}
```

**Параметри:**
- `qrToken` (обов'язково) - токен QR коду отриманий при скануванні
- `storeId` (обов'язково) - ідентифікатор магазину
- `cashierId` (опціонально) - ідентифікатор касира
- `transactionAmount` (опціонально) - сума транзакції

---

### 4. Історія QR кодів клієнта

**Endpoint:** `GET /api/qr/history/:phone`

**Опис:** Отримання всіх QR кодів клієнта (використані та неактивні)

**Request:**
```
GET /api/qr/history/+380685552629
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "QRToken": "a3b5c7d9...",
      "PhoneNum": "380685552629",
      "ClientName": "Іванов Іван Іванович",
      "Balance": 1250,
      "CreatedAt": "2025-12-20T12:00:00.000Z",
      "ValidUntil": "2025-12-20T12:05:00.000Z",
      "IsUsed": true,
      "UsedAt": "2025-12-20T12:03:45.000Z",
      "StoreId": "STORE_001",
      "CashierId": "CASHIER_123"
    }
  ]
}
```

---

## Stored Procedures для SQL програміста

### 1. zeus_CreateQR

**Призначення:** Створення нового QR коду в базі даних

**Параметри:**
```sql
CREATE PROCEDURE [AZIT].[dbo].[zeus_CreateQR]
    @QRToken NVARCHAR(100),
    @PhoneNum NVARCHAR(20),
    @ClientName NVARCHAR(200),
    @Balance INT,
    @ValidUntil DATETIME,
    @IsUsed BIT
AS
BEGIN
    INSERT INTO AZIT.dbo.QRCodes (
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
    
    SELECT @@ROWCOUNT as RowsAffected;
END
```

---

### 2. zeus_ValidateQR

**Призначення:** Перевірка валідності QR коду

**Параметри:**
```sql
CREATE PROCEDURE [AZIT].[dbo].[zeus_ValidateQR]
    @QRToken NVARCHAR(100)
AS
BEGIN
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
    FROM AZIT.dbo.QRCodes
    WHERE QRToken = @QRToken;
END
```

---

### 3. zeus_UseQR

**Призначення:** Позначити QR код як використаний при оплаті в касі

**Параметри:**
```sql
CREATE PROCEDURE [AZIT].[dbo].[zeus_UseQR]
    @QRToken NVARCHAR(100),
    @StoreId NVARCHAR(50),
    @CashierId NVARCHAR(50),
    @TransactionAmount DECIMAL(18,2)
AS
BEGIN
    DECLARE @PhoneNum NVARCHAR(20);
    DECLARE @ClientName NVARCHAR(200);
    DECLARE @IsUsed BIT;
    DECLARE @ValidUntil DATETIME;
    
    -- Перевірка чи існує QR код
    SELECT 
        @PhoneNum = PhoneNum,
        @ClientName = ClientName,
        @IsUsed = IsUsed,
        @ValidUntil = ValidUntil
    FROM AZIT.dbo.QRCodes
    WHERE QRToken = @QRToken;
    
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
    UPDATE AZIT.dbo.QRCodes
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
END
```

---

### 4. zeus_GetQRHistory

**Призначення:** Отримання історії всіх QR кодів клієнта

**Параметри:**
```sql
CREATE PROCEDURE [AZIT].[dbo].[zeus_GetQRHistory]
    @PhoneNum NVARCHAR(20)
AS
BEGIN
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
        TransactionAmount
    FROM AZIT.dbo.QRCodes
    WHERE PhoneNum = @PhoneNum
    ORDER BY CreatedAt DESC;
END
```

---

## Структура таблиці QRCodes

```sql
CREATE TABLE [AZIT].[dbo].[QRCodes] (
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
    [TransactionAmount] DECIMAL(18,2) NULL
);

-- Індекси для оптимізації
CREATE INDEX IX_QRCodes_PhoneNum ON [AZIT].[dbo].[QRCodes] (PhoneNum);
CREATE INDEX IX_QRCodes_QRToken ON [AZIT].[dbo].[QRCodes] (QRToken);
CREATE INDEX IX_QRCodes_ValidUntil ON [AZIT].[dbo].[QRCodes] (ValidUntil);
CREATE INDEX IX_QRCodes_IsUsed ON [AZIT].[dbo].[QRCodes] (IsUsed);
```

---

## Сценарії використання

### Сценарій 1: Клієнт показує QR код в магазині

1. **Мобільний додаток** викликає `POST /api/qr/generate` з номером телефону клієнта
2. Додаток отримує `qrToken` та відображає його як QR код
3. **Касир сканує** QR код в програмі АБ Офіс
4. **АБ Офіс** викликає `GET /api/qr/validate/:qrToken` для перевірки валідності
5. Якщо валідний, **АБ Офіс** викликає `POST /api/qr/use` з параметрами транзакції
6. Система зберігає факт використання QR коду

### Сценарій 2: Перегляд історії в додатку

1. **Мобільний додаток** викликає `GET /api/qr/history/:phone`
2. Отримує список всіх QR кодів (використаних та неактивних)
3. Відображає історію клієнту

---

## Коди помилок

- `400` - Bad Request (невірні параметри)
- `404` - Not Found (QR код не знайдено)
- `500` - Internal Server Error (помилка сервера)

---

## Приклади використання

### cURL приклади

**Генерація QR:**
```bash
curl -X POST http://localhost:3001/api/qr/generate \
  -H "Content-Type: application/json" \
  -d '{"phone":"+380685552629","clientName":"Іванов Іван","balance":1250}'
```

**Перевірка валідності:**
```bash
curl http://localhost:3001/api/qr/validate/a3b5c7d9e1f2g3h4i5j6k7l8m9n0o1p2
```

**Використання QR:**
```bash
curl -X POST http://localhost:3001/api/qr/use \
  -H "Content-Type: application/json" \
  -d '{"qrToken":"a3b5c7d9e1f2g3h4i5j6k7l8m9n0o1p2","storeId":"STORE_001","cashierId":"CASHIER_123","transactionAmount":1500.50}'
```

**Історія:**
```bash
curl http://localhost:3001/api/qr/history/+380685552629
```

---

## Контакти для підтримки

Для питань щодо інтеграції з АБ Офіс звертайтесь до технічної підтримки.
