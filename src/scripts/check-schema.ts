import { getConnection } from '../config/database';

async function checkSchema() {
  try {
    const pool = await getConnection();
    
    // Показати всі таблиці
    const tables = await pool.request().query(`
      SELECT TABLE_SCHEMA, TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_TYPE = 'BASE TABLE'
      ORDER BY TABLE_SCHEMA, TABLE_NAME
    `);
    
    console.log('\n📊 Таблиці в базі даних:');
    tables.recordset.forEach((table: any) => {
      console.log(`   ${table.TABLE_SCHEMA}.${table.TABLE_NAME}`);
    });
    
    // Показати колонки таблиці Clients
    const columns = await pool.request().query(`
      SELECT TABLE_SCHEMA, COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'Clients'
      ORDER BY ORDINAL_POSITION
    `);
    
    console.log('\n📋 Колонки таблиці Clients:');
    if (columns.recordset.length > 0) {
      columns.recordset.forEach((col: any) => {
        const length = col.CHARACTER_MAXIMUM_LENGTH ? `(${col.CHARACTER_MAXIMUM_LENGTH})` : '';
        console.log(`   ${col.TABLE_SCHEMA}.${col.COLUMN_NAME}: ${col.DATA_TYPE}${length} ${col.IS_NULLABLE}`);
      });
    } else {
      console.log('   ❌ Таблиця Clients не знайдена');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Помилка:', error);
    process.exit(1);
  }
}

checkSchema();
