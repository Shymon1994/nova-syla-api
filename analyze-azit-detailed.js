const sql = require('mssql');

const config = {
  server: '10.131.10.25',
  database: 'AZIT',
  user: 'zeus',
  password: 'zeus',
  port: 1433,
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true,
  },
  requestTimeout: 30000,
};

async function analyzeDatabase() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('         📊 ДЕТАЛЬНИЙ АНАЛІЗ БАЗИ ДАНИХ AZIT');
  console.log('═══════════════════════════════════════════════════════════\n');

  try {
    await sql.connect(config);
    console.log('✅ Підключено до SQL Server: 10.131.10.25');
    console.log('✅ База даних: AZIT\n');

    // ========================================
    // КРОК 1: Список всіх таблиць
    // ========================================
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('КРОК 1: Всі таблиці в базі даних');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    const tablesResult = await sql.query`
      SELECT 
        TABLE_SCHEMA,
        TABLE_NAME,
        TABLE_TYPE
      FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_TYPE = 'BASE TABLE'
      ORDER BY TABLE_SCHEMA, TABLE_NAME
    `;

    console.log(`Знайдено таблиць: ${tablesResult.recordset.length}\n`);
    
    tablesResult.recordset.forEach((t, idx) => {
      console.log(`${idx + 1}. ${t.TABLE_SCHEMA}.${t.TABLE_NAME}`);
    });

    // ========================================
    // КРОК 2: Детальний аналіз кожної таблиці
    // ========================================
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('КРОК 2: Структура та вміст кожної таблиці');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    for (const table of tablesResult.recordset) {
      const fullTableName = `${table.TABLE_SCHEMA}.${table.TABLE_NAME}`;
      
      console.log(`\n┌─────────────────────────────────────────────────────────────┐`);
      console.log(`│ 📋 ТАБЛИЦЯ: ${fullTableName.padEnd(45)} │`);
      console.log(`└─────────────────────────────────────────────────────────────┘`);

      try {
        // Структура таблиці (колонки)
        const columnsResult = await sql.query`
          SELECT 
            COLUMN_NAME,
            DATA_TYPE,
            CHARACTER_MAXIMUM_LENGTH,
            IS_NULLABLE,
            COLUMN_DEFAULT
          FROM INFORMATION_SCHEMA.COLUMNS
          WHERE TABLE_SCHEMA = ${table.TABLE_SCHEMA}
            AND TABLE_NAME = ${table.TABLE_NAME}
          ORDER BY ORDINAL_POSITION
        `;

        console.log('\n📊 Структура (колонки):');
        console.log('─────────────────────────────────────────────────────────────');
        columnsResult.recordset.forEach((col, idx) => {
          const length = col.CHARACTER_MAXIMUM_LENGTH ? `(${col.CHARACTER_MAXIMUM_LENGTH})` : '';
          const nullable = col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL';
          console.log(`  ${(idx + 1).toString().padStart(2)}. ${col.COLUMN_NAME.padEnd(30)} ${col.DATA_TYPE}${length.padEnd(10)} ${nullable}`);
        });

        // Кількість записів
        const countResult = await sql.query(`SELECT COUNT(*) as Total FROM ${fullTableName}`);
        const totalRecords = countResult.recordset[0].Total;
        
        console.log(`\n📈 Кількість записів: ${totalRecords}`);

        // Приклади даних (перші 3 записи)
        if (totalRecords > 0) {
          console.log('\n📝 Приклади даних (перші 3 записи):');
          console.log('─────────────────────────────────────────────────────────────');
          
          const sampleResult = await sql.query(`SELECT TOP 3 * FROM ${fullTableName}`);
          
          sampleResult.recordset.forEach((row, idx) => {
            console.log(`\n  Запис #${idx + 1}:`);
            Object.entries(row).forEach(([key, value]) => {
              let displayValue = value;
              if (value === null) {
                displayValue = '(NULL)';
              } else if (value instanceof Date) {
                displayValue = value.toISOString();
              } else if (typeof value === 'string' && value.length > 50) {
                displayValue = value.substring(0, 50) + '...';
              }
              console.log(`    ${key}: ${displayValue}`);
            });
          });
        } else {
          console.log('  ⚠️ Таблиця порожня (немає даних)');
        }

      } catch (err) {
        console.log(`  ❌ Помилка аналізу таблиці: ${err.message}`);
      }
    }

    // ========================================
    // КРОК 3: Збережені процедури
    // ========================================
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('КРОК 3: Збережені процедури');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const proceduresResult = await sql.query`
      SELECT 
        SPECIFIC_SCHEMA,
        SPECIFIC_NAME,
        ROUTINE_TYPE
      FROM INFORMATION_SCHEMA.ROUTINES
      WHERE ROUTINE_TYPE = 'PROCEDURE'
      ORDER BY SPECIFIC_SCHEMA, SPECIFIC_NAME
    `;

    console.log(`Знайдено процедур: ${proceduresResult.recordset.length}\n`);
    
    proceduresResult.recordset.forEach((proc, idx) => {
      console.log(`${idx + 1}. ${proc.SPECIFIC_SCHEMA}.${proc.SPECIFIC_NAME}`);
    });

    // ========================================
    // КРОК 4: Функції
    // ========================================
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('КРОК 4: Функції');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const functionsResult = await sql.query`
      SELECT 
        SPECIFIC_SCHEMA,
        SPECIFIC_NAME,
        ROUTINE_TYPE
      FROM INFORMATION_SCHEMA.ROUTINES
      WHERE ROUTINE_TYPE = 'FUNCTION'
      ORDER BY SPECIFIC_SCHEMA, SPECIFIC_NAME
    `;

    console.log(`Знайдено функцій: ${functionsResult.recordset.length}\n`);
    
    if (functionsResult.recordset.length > 0) {
      functionsResult.recordset.forEach((func, idx) => {
        console.log(`${idx + 1}. ${func.SPECIFIC_SCHEMA}.${func.SPECIFIC_NAME}`);
      });
    } else {
      console.log('  ⚠️ Функцій не знайдено');
    }

    // ========================================
    // КРОК 5: Views (представлення)
    // ========================================
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('КРОК 5: Views (Представлення)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const viewsResult = await sql.query`
      SELECT 
        TABLE_SCHEMA,
        TABLE_NAME
      FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_TYPE = 'VIEW'
      ORDER BY TABLE_SCHEMA, TABLE_NAME
    `;

    console.log(`Знайдено views: ${viewsResult.recordset.length}\n`);
    
    if (viewsResult.recordset.length > 0) {
      viewsResult.recordset.forEach((view, idx) => {
        console.log(`${idx + 1}. ${view.TABLE_SCHEMA}.${view.TABLE_NAME}`);
      });
    } else {
      console.log('  ⚠️ Views не знайдено');
    }

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('               ✅ АНАЛІЗ ЗАВЕРШЕНО');
    console.log('═══════════════════════════════════════════════════════════\n');

    await sql.close();
    
  } catch (err) {
    console.error('\n❌ КРИТИЧНА ПОМИЛКА:', err.message);
    console.error('Стек:', err.stack);
    await sql.close();
  }
}

analyzeDatabase();
