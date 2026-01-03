/**
 * Перевірка даних в таблиці Stores
 */
import { getConnection } from '../config/database';

async function checkStores() {
  try {
    console.log('🔍 Перевірка магазинів в базі даних...\n');
    
    const pool = await getConnection();
    
    const result = await pool.request().query(`
      SELECT 
        Id,
        StoreId,
        StoreName,
        StoreType,
        Address,
        City,
        Region,
        Phone,
        WorkingHours,
        IsActive
      FROM Stores
      ORDER BY Id DESC
    `);
    
    console.log(`📊 Знайдено магазинів: ${result.recordset.length}\n`);
    
    result.recordset.forEach((store, index) => {
      console.log(`${index + 1}. ${store.StoreName} (${store.StoreType})`);
      console.log(`   ID: ${store.StoreId}`);
      console.log(`   Адреса: ${store.Address}, ${store.City}, ${store.Region}`);
      console.log(`   Телефон: ${store.Phone || 'N/A'}`);
      console.log(`   Години роботи: ${store.WorkingHours || 'N/A'}`);
      console.log(`   Активний: ${store.IsActive ? 'Так' : 'Ні'}`);
      console.log('');
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Помилка:', error);
    process.exit(1);
  }
}

checkStores();
