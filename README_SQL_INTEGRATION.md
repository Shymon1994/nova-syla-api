# Інструкція для SQL програміста - Інтеграція Nova Syla з АБ Офіс

## Огляд системи

Система лояльності Nova Syla інтегрується з програмою продажу АБ Офіс через REST API та SQL Server базу даних.

### Архітектура

```
[Мобільний додаток] <--> [Node.js API] <--> [SQL Server AZIT] <--> [АБ Офіс]
```

## Швидкий старт

### 1. Встановлення бази даних

Виконайте SQL скрипт `database_setup.sql`:

```bash
sqlcmd -S 10.131.10.25 -d AZIT -U zeus -P zeus -i database_setup.sql
```

Або через SQL Server Management Studio:
1. Відкрийте файл `database_setup.sql`
2. Підключіться до сервера `10.131.10.25`
3. Виберіть базу даних `AZIT`
4. Виконайте скрипт (F5)

### 2. Перевірка встановлення

```sql
-- Перевірка таблиці
SELECT * FROM AZIT.dbo.QRCodes;

-- Перевірка stored procedures
SELECT name FROM sys.procedures WHERE name LIKE 'zeus_%QR%';
```

Має повернути:
- `zeus_CreateQR`
- `zeus_ValidateQR`
- `zeus_UseQR`
- `zeus_GetQRHistory`
- `zeus_CleanupExpiredQR`

## Робота з QR кодами

### Lifecycle QR коду

```
1. [Генерація] -> QR код створюється в додатку (API POST /api/qr/generate)
2. [Валідація] -> Касир сканує QR в АБ Офіс (API GET /api/qr/validate/:token)
3. [Використання] -> Система позначає QR як використаний (API POST /api/qr/use)
4. [Історія] -> Користувач бачить історію в додатку (API GET /api/qr/history/:phone)
```

### Сценарій використання в АБ Офіс

#### Крок 1: Клієнт показує QR код

Коли клієнт відкриває додаток:
1. Додаток викликає API `POST /api/qr/generate`
2. Створюється запис у таблиці `QRCodes`
3. QR код відображається на екрані телефону
4. Код діє 5 хвилин

#### Крок 2: Касир сканує QR

В програмі АБ Офіс потрібно додати функціонал:

```sql
-- Приклад виклику з АБ Офіс
DECLARE @QRToken NVARCHAR(100) = 'token_from_scanner';

-- Перевірка валідності
EXEC zeus_ValidateQR @QRToken = @QRToken;

-- Результат:
-- IsValid = 1 -> можна використовувати
-- IsValid = 0 -> застарів або вже використаний
```

#### Крок 3: Оплата/Нарахування балів

Після успішної транзакції:

```sql
-- Позначити QR як використаний
EXEC zeus_UseQR 
    @QRToken = 'token_from_scanner',
    @StoreId = 'STORE_001',        -- ID магазину з АБ Офіс
    @CashierId = 'CASHIER_123',    -- ID касира
    @TransactionAmount = 1500.50;  -- Сума покупки
```

## Інтеграція з АБ Офіс

### Варіант 1: Прямий виклик з АБ Офіс через HTTP

Якщо АБ Офіс підтримує HTTP запити:

```vbnet
' Visual Basic приклад
Dim http As Object
Set http = CreateObject("MSXML2.XMLHTTP")

' Перевірка QR
http.Open "GET", "http://localhost:3001/api/qr/validate/" & qrToken, False
http.Send
MsgBox http.responseText

' Використання QR
Dim jsonData As String
jsonData = "{""qrToken"":""" & qrToken & """,""storeId"":""STORE_001""}"
http.Open "POST", "http://localhost:3001/api/qr/use", False
http.setRequestHeader "Content-Type", "application/json"
http.Send jsonData
```

### Варіант 2: Через SQL Stored Procedures

Можна викликати API з SQL через CLR або xp_cmdshell:

```sql
-- Приклад використання через PowerShell
DECLARE @QRToken NVARCHAR(100) = 'token_here';
DECLARE @StoreId NVARCHAR(50) = 'STORE_001';

DECLARE @PowerShell NVARCHAR(MAX) = N'
$body = @{
    qrToken = "' + @QRToken + '"
    storeId = "' + @StoreId + '"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3001/api/qr/use" -Method POST -Body $body -ContentType "application/json"
';

-- Виконання (потребує налаштування xp_cmdshell)
-- EXEC sp_configure 'xp_cmdshell', 1; RECONFIGURE;
-- EXEC xp_cmdshell @PowerShell;
```

### Варіант 3: Hybrid - SQL + API

Рекомендований підхід:

```sql
-- 1. АБ Офіс викликає stored procedure
EXEC zeus_ValidateQR @QRToken = 'token';

-- 2. Перевіряє результат IsValid
-- 3. Якщо valid, виконує транзакцію в АБ Офіс
-- 4. Після успішної транзакції викликає:
EXEC zeus_UseQR 
    @QRToken = 'token',
    @StoreId = 'STORE_001',
    @CashierId = 'CASHIER_123',
    @TransactionAmount = 1500.50;
```

## Приклади запитів

### Тест 1: Створення QR коду

```sql
-- Створення тестового QR
EXEC zeus_CreateQR
    @QRToken = 'TEST_' + CONVERT(VARCHAR(50), NEWID()),
    @PhoneNum = '380685552629',
    @ClientName = 'Скачек Дмитро Сергійович',
    @Balance = 1250,
    @ValidUntil = DATEADD(MINUTE, 5, GETDATE()),
    @IsUsed = 0;

-- Перевірка створення
SELECT TOP 1 * FROM QRCodes ORDER BY CreatedAt DESC;
```

### Тест 2: Валідація QR коду

```sql
-- Отримання останнього створеного токену
DECLARE @Token NVARCHAR(100);
SELECT TOP 1 @Token = QRToken FROM QRCodes ORDER BY CreatedAt DESC;

-- Перевірка валідності
EXEC zeus_ValidateQR @QRToken = @Token;
```

### Тест 3: Використання QR коду

```sql
DECLARE @Token NVARCHAR(100);
SELECT TOP 1 @Token = QRToken FROM QRCodes WHERE IsUsed = 0 ORDER BY CreatedAt DESC;

-- Використання
EXEC zeus_UseQR 
    @QRToken = @Token,
    @StoreId = 'TEST_STORE',
    @CashierId = 'TEST_CASHIER',
    @TransactionAmount = 999.99;

-- Перевірка
SELECT * FROM QRCodes WHERE QRToken = @Token;
```

### Тест 4: Історія клієнта

```sql
-- Отримання історії по номеру телефону
EXEC zeus_GetQRHistory @PhoneNum = '380685552629';
```

## Моніторинг та обслуговування

### Щоденна очистка застарілих QR кодів

Рекомендується створити SQL Agent Job:

```sql
-- Видалення QR старших 30 днів
EXEC zeus_CleanupExpiredQR @DaysToKeep = 30;
```

### Статистика використання

```sql
-- Кількість створених QR за сьогодні
SELECT COUNT(*) as TotalCreated
FROM QRCodes
WHERE CAST(CreatedAt AS DATE) = CAST(GETDATE() AS DATE);

-- Кількість використаних QR за сьогодні
SELECT COUNT(*) as TotalUsed
FROM QRCodes
WHERE CAST(UsedAt AS DATE) = CAST(GETDATE() AS DATE);

-- Топ магазинів по використанню QR
SELECT StoreId, COUNT(*) as QRUsed
FROM QRCodes
WHERE IsUsed = 1
GROUP BY StoreId
ORDER BY QRUsed DESC;
```

## Troubleshooting

### Проблема: QR код не валідується

```sql
-- Перевірка наявності
SELECT * FROM QRCodes WHERE QRToken = 'ваш_токен';

-- Якщо запис існує, перевірте:
-- 1. ValidUntil > GETDATE() - чи не застарів
-- 2. IsUsed = 0 - чи не використаний
```

### Проблема: Не можу створити QR

```sql
-- Перевірка унікальності токену
SELECT QRToken FROM QRCodes WHERE QRToken = 'ваш_токен';

-- Якщо токен існує, згенеруйте новий
```

### Проблема: API не відповідає

```bash
# Перевірка доступності API
curl http://localhost:3001/health

# Перевірка конкретного endpoint
curl http://localhost:3001/api/qr/validate/test_token
```

## Контактна інформація

Для технічної підтримки та питань щодо інтеграції:
- API документація: `backend/SQL_API_DOCUMENTATION.md`
- SQL скрипти: `backend/database_setup.sql`

## Додаткові матеріали

### Діаграма процесу

```
┌─────────────┐      ┌──────────┐      ┌──────────────┐
│  Мобільний  │─────>│ Node API │─────>│  SQL Server  │
│   додаток   │<─────│          │<─────│    AZIT      │
└─────────────┘      └──────────┘      └──────────────┘
                                              │
                                              v
                                        ┌──────────┐
                                        │ АБ Офіс  │
                                        └──────────┘
```

### Структура QR токену

QR токен - це 64-символьний hex string, згенерований через crypto.randomBytes(32).

Приклад: `a3b5c7d9e1f2g3h4i5j6k7l8m9n0o1p2q3r4s5t6u7v8w9x0y1z2a3b4c5d6e7f8`

### Безпека

1. **Термін дії**: Кожен QR код діє лише 5 хвилин
2. **Одноразове використання**: Після використання QR не можна використати повторно
3. **Унікальність**: Кожен токен унікальний та непередбачуваний

## Чеклист інтеграції

- [ ] Виконано SQL скрипт database_setup.sql
- [ ] Перевірено створення всіх stored procedures
- [ ] Протестовано створення QR через zeus_CreateQR
- [ ] Протестовано валідацію через zeus_ValidateQR
- [ ] Протестовано використання через zeus_UseQR
- [ ] Додано логіку сканування QR в АБ Офіс
- [ ] Налаштовано виклик API з АБ Офіс
- [ ] Створено SQL Agent Job для очистки застарілих QR
- [ ] Перевірено синхронізацію балансів між системами

---

**Версія документа**: 1.0  
**Дата**: 20 грудня 2025  
**Автор**: Nova Syla Development Team
