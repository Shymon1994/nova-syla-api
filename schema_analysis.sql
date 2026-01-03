USE AZIT;
GO

DECLARE @User sysname = USER_NAME();    -- поточний користувач у БД
DECLARE @SampleTop int = 10;            -- скільки рядків-прикладів на таблицю
DECLARE @MaxTables int = 20;            -- з скількох таблиць брати приклади

PRINT 'Логін: ' + SUSER_SNAME() + ' / Користувач БД: ' + @User + ' / БД: ' + DB_NAME();

-- 1) Таблиці та приблизна кількість рядків
PRINT '1) Таблиці та приблизна кількість рядків';
SELECT
    s.name AS [Схема],
    t.name AS [Таблиця],
    SUM(ps.row_count) AS [ПриблизноРядків]
FROM sys.tables t
JOIN sys.schemas s ON s.schema_id = t.schema_id
JOIN (
    SELECT object_id,
           SUM(CASE WHEN index_id IN (0,1) THEN row_count ELSE 0 END) AS row_count
    FROM sys.dm_db_partition_stats
    GROUP BY object_id
) ps ON ps.object_id = t.object_id
GROUP BY s.name, t.name
ORDER BY s.name, t.name;

-- 2) Всі колонки
PRINT '2) Усі колонки';
SELECT
    TABLE_SCHEMA AS [Схема],
    TABLE_NAME   AS [Таблиця],
    ORDINAL_POSITION AS [№],
    COLUMN_NAME  AS [Колонка],
    DATA_TYPE    AS [ТипДаних],
    CHARACTER_MAXIMUM_LENGTH AS [МаксДовжина],
    IS_NULLABLE  AS [Nullable]
FROM INFORMATION_SCHEMA.COLUMNS
ORDER BY TABLE_SCHEMA, TABLE_NAME, ORDINAL_POSITION;

-- 3) Представлення (Views)
PRINT '3) Представлення (Views)';
SELECT TABLE_SCHEMA AS [Схема], TABLE_NAME AS [Представлення]
FROM INFORMATION_SCHEMA.VIEWS
ORDER BY TABLE_SCHEMA, TABLE_NAME;

-- 4) Збережені процедури та функції
PRINT '4) Збережені процедури';
SELECT SPECIFIC_SCHEMA AS [Схема], SPECIFIC_NAME AS [Процедура]
FROM INFORMATION_SCHEMA.ROUTINES
WHERE ROUTINE_TYPE = 'PROCEDURE'
ORDER BY SPECIFIC_SCHEMA, SPECIFIC_NAME;

PRINT '4b) Функції';
SELECT SPECIFIC_SCHEMA AS [Схема], SPECIFIC_NAME AS [Функція], DATA_TYPE AS [ТипПовернення]
FROM INFORMATION_SCHEMA.ROUTINES
WHERE ROUTINE_TYPE = 'FUNCTION'
ORDER BY SPECIFIC_SCHEMA, SPECIFIC_NAME;

-- 5) Права доступу
PRINT '5) Права доступу поточного користувача';
SELECT
    dp.state_desc      AS [Стан],            -- GRANT/DENY
    dp.permission_name AS [Дозвіл],          -- SELECT/INSERT/UPDATE/DELETE/EXECUTE...
    COALESCE(QUOTENAME(SCHEMA_NAME(o.schema_id)) + '.' + QUOTENAME(o.name), '(Рівень БД)') AS [Об''єкт],
    o.type_desc        AS [ТипОб''єкта]
FROM sys.database_permissions dp
LEFT JOIN sys.objects o ON o.object_id = dp.major_id
WHERE dp.grantee_principal_id = DATABASE_PRINCIPAL_ID(@User)
ORDER BY [Дозвіл], [Об''єкт];

PRINT '5b) Членство в ролях';
SELECT rp.name AS [Роль], mp.name AS [Член]
FROM sys.database_role_members drm
JOIN sys.database_principals rp ON rp.principal_id = drm.role_principal_id
JOIN sys.database_principals mp ON mp.principal_id = drm.member_principal_id
WHERE mp.name = @User
ORDER BY rp.name;

-- 6) Зразки даних з перших @MaxTables таблиць (по @SampleTop рядків)
PRINT '6) Зразки даних';
DECLARE @sql nvarchar(max) = N'';

;WITH t AS (
    SELECT TOP (@MaxTables)
           QUOTENAME(s.name) AS Sch, QUOTENAME(tb.name) AS Tbl
    FROM sys.tables tb
    JOIN sys.schemas s ON s.schema_id = tb.schema_id
    ORDER BY s.name, tb.name
)
SELECT @sql = STRING_AGG(
           N'SELECT TOP(' + CAST(@SampleTop AS nvarchar(10)) + N') * FROM '
           + Sch + N'.' + Tbl + N' ORDER BY 1;'
       , CHAR(13) + CHAR(10))
FROM t;

IF @sql IS NOT NULL AND LEN(@sql) > 0
    EXEC sp_executesql @sql;
ELSE
    PRINT 'Немає таблиць для вибірки.';
