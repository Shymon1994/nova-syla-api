import sql from 'mssql';

const config: sql.config = {
  server: '10.131.10.25',
  database: 'AZIT',
  user: 'zeus',
  password: 'zeus',
  options: {
    encrypt: false,
    trustServerCertificate: true
  }
};

async function diagnoseTables() {
  let pool: sql.ConnectionPool | null = null;
  try {
    pool = await sql.connect(config);
    console.log('✅ Підключено до SQL Server\n');

    // 1. Отримати список таблиць
    console.log('═══════════════════════════════════════');
    console.log('📊 ТАБЛИЦІ ТА КІЛЬКІСТЬ РЯДКІВ');
    console.log('═══════════════════════════════════════\n');
    
    const tablesResult = await sql.query`
      SELECT 
        s.name AS [Schema],
        t.name AS TableName,
        SUM(ps.row_count) AS ApproxRows
      FROM sys.tables t
      JOIN sys.schemas s ON s.schema_id = t.schema_id
      JOIN (
        SELECT object_id,
               SUM(CASE WHEN index_id IN (0,1) THEN row_count ELSE 0 END) AS row_count
        FROM sys.dm_db_partition_stats
        GROUP BY object_id
      ) ps ON ps.object_id = t.object_id
      GROUP BY s.name, t.name
      ORDER BY SUM(ps.row_count) DESC
    `;

    tablesResult.recordset.forEach((table: any) => {
      console.log(`📋 ${table.Schema}.${table.TableName} - ${table.ApproxRows.toLocaleString()} рядків`);
    });

    // 2. Знайти таблицю з телефонами
    console.log('\n═══════════════════════════════════════');
    console.log('🔍 ПОШУК ТАБЛИЦІ З ТЕЛЕФОНАМИ');
    console.log('═══════════════════════════════════════\n');

    const columnsResult = await sql.query`
      SELECT 
        TABLE_SCHEMA,
        TABLE_NAME,
        COLUMN_NAME,
        DATA_TYPE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE COLUMN_NAME LIKE '%phone%' 
         OR COLUMN_NAME LIKE '%телефон%'
         OR COLUMN_NAME LIKE '%NAME%'
         OR COLUMN_NAME LIKE '%F7%'
         OR COLUMN_NAME LIKE '%ПІБ%'
         OR COLUMN_NAME LIKE '%Client%'
      ORDER BY TABLE_NAME, ORDINAL_POSITION
    `;

    const groupedColumns: { [key: string]: string[] } = {};
    columnsResult.recordset.forEach((col: any) => {
      const tableName = `${col.TABLE_SCHEMA}.${col.TABLE_NAME}`;
      if (!groupedColumns[tableName]) {
        groupedColumns[tableName] = [];
      }
      groupedColumns[tableName].push(`${col.COLUMN_NAME} (${col.DATA_TYPE})`);
    });

    Object.entries(groupedColumns).forEach(([table, columns]) => {
      console.log(`\n📌 ${table}:`);
      columns.forEach(col => console.log(`   - ${col}`));
    });

    // 3. Збережені процедури
    console.log('\n═══════════════════════════════════════');
    console.log('⚙️  ЗБЕРЕЖЕНІ ПРОЦЕДУРИ');
    console.log('═══════════════════════════════════════\n');

    const procsResult = await sql.query`
      SELECT 
        SPECIFIC_SCHEMA,
        SPECIFIC_NAME,
        ROUTINE_TYPE
      FROM INFORMATION_SCHEMA.ROUTINES
      WHERE SPECIFIC_NAME LIKE '%zeus%'
         OR SPECIFIC_NAME LIKE '%client%'
         OR SPECIFIC_NAME LIKE '%QR%'
      ORDER BY SPECIFIC_NAME
    `;

    procsResult.recordset.forEach((proc: any) => {
      const icon = proc.ROUTINE_TYPE === 'PROCEDURE' ? '🔧' : '📝';
      console.log(`${icon} ${proc.SPECIFIC_SCHEMA}.${proc.SPECIFIC_NAME}`);
    });

    // 4. Тестовий виклик zeus_GetCli
    console.log('\n═══════════════════════════════════════');
    console.log('🧪 ТЕСТ zeus_GetCli');
    console.log('═══════════════════════════════════════\n');

    try {
      const request = new sql.Request();
      request.input('PhoneNum', sql.VarChar(20), '+380960608968');
      const result = await request.execute('zeus_GetCli');

      console.log(`Кількість recordset: ${result.recordsets.length}`);
      
      if (Array.isArray(result.recordsets)) {
        result.recordsets.forEach((recordset: any, idx: number) => {
          console.log(`\n📦 Recordset ${idx + 1}:`);
          if (recordset.length > 0) {
            console.log(`   Колонки: ${Object.keys(recordset[0]).join(', ')}`);
            console.log(`   Рядків: ${recordset.length}`);
            console.log('\n   Дані:');
            recordset.forEach((row: any) => {
              console.log(`   ${JSON.stringify(row, null, 2)}`);
            });
          } else {
            console.log('   (порожній recordset)');
          }
        });
      }

    } catch (procError: any) {
      console.log(`❌ Помилка виклику: ${procError.message}`);
    }

    if (pool) {
      await pool.close();
    }
    console.log('\n✅ Діагностика завершена');

  } catch (error: any) {
    console.error('❌ Помилка:', error.message);
  }
}

diagnoseTables();
