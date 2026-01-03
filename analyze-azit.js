const sql = require('mssql');

const config = {
  server: '10.131.10.25',
  database: 'AZIT',
  user: 'zeus',
  password: 'zeus',
  options: {
    encrypt: false,
    trustServerCertificate: true
  }
};

async function analyzeAzitDatabase() {
  try {
    await sql.connect(config);
    
    console.log('\n🔍 Аналіз структури бази AZIT\n');
    console.log('='.repeat(60));
    
    // 1. Збережені процедури
    console.log('\n📋 Збережені процедури:');
    const procedures = await sql.query`
      SELECT SPECIFIC_SCHEMA AS [Schema], SPECIFIC_NAME AS [Name]
      FROM INFORMATION_SCHEMA.ROUTINES
      WHERE ROUTINE_TYPE = 'PROCEDURE'
      ORDER BY SPECIFIC_SCHEMA, SPECIFIC_NAME
    `;
    
    procedures.recordset.forEach(p => {
      console.log(`  ${p.Schema}.${p.Name}`);
    });
    
    // 2. Таблиці
    console.log('\n📊 Таблиці:');
    const tables = await sql.query`
      SELECT TABLE_SCHEMA AS [Schema], TABLE_NAME AS [Name]
      FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_TYPE = 'BASE TABLE'
      ORDER BY TABLE_SCHEMA, TABLE_NAME
    `;
    
    tables.recordset.forEach(t => {
      console.log(`  ${t.Schema}.${t.Name}`);
    });
    
    // 3. Процедури зі словом Client
    console.log('\n👥 Процедури для роботи з клієнтами (Client):');
    const clientProcs = await sql.query`
      SELECT SPECIFIC_SCHEMA AS [Schema], SPECIFIC_NAME AS [Name]
      FROM INFORMATION_SCHEMA.ROUTINES
      WHERE ROUTINE_TYPE = 'PROCEDURE' AND SPECIFIC_NAME LIKE '%Client%'
      ORDER BY SPECIFIC_NAME
    `;
    
    if (clientProcs.recordset.length > 0) {
      clientProcs.recordset.forEach(p => {
        console.log(`  ✅ ${p.Schema}.${p.Name}`);
      });
    } else {
      console.log('  ❌ Не знайдено');
    }
    
    // 4. Перевірка існуючих процедур zeus_GetCli
    console.log('\n🔍 Процедура zeus_GetCli:');
    const zeusProc = await sql.query`
      SELECT SPECIFIC_SCHEMA AS [Schema], SPECIFIC_NAME AS [Name]
      FROM INFORMATION_SCHEMA.ROUTINES
      WHERE ROUTINE_TYPE = 'PROCEDURE' AND SPECIFIC_NAME = 'zeus_GetCli'
    `;
    
    if (zeusProc.recordset.length > 0) {
      console.log(`  ✅ Існує: ${zeusProc.recordset[0].Schema}.${zeusProc.recordset[0].Name}`);
    } else {
      console.log('  ❌ Не знайдено');
    }
    
    console.log('\n' + '='.repeat(60) + '\n');
    
    await sql.close();
  } catch (err) {
    console.error('❌ Помилка:', err.message);
    await sql.close();
  }
}

analyzeAzitDatabase();
