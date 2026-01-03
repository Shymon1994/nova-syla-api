/**
 * Clear Test Data Script
 * Видаляє всі тестові дані з бази
 */
import { getConnection, closeConnection } from '../config/database';

async function clearTestData() {
  console.log('🚀 Очищення тестових даних...\n');
  
  try {
    const pool = await getConnection();
    console.log('✅ Підключено до SQL Server\n');
    
    // Показуємо поточний стан
    console.log('📊 Поточний стан бази:\n');
    
    const stats = await pool.request().query(`
      SELECT 
        (SELECT COUNT(*) FROM AZIT.dbo.QRCodes) as qrCodes,
        (SELECT COUNT(*) FROM AZIT.dbo.Promotions) as promotions,
        (SELECT COUNT(*) FROM AZIT.dbo.PromotionUsage) as promotionUsage,
        (SELECT COUNT(*) FROM AZIT.dbo.Stores) as stores
    `);
    
    const stat = stats.recordset[0];
    console.log(`  QR Codes: ${stat.qrCodes}`);
    console.log(`  Promotions: ${stat.promotions}`);
    console.log(`  Promotion Usage: ${stat.promotionUsage}`);
    console.log(`  Stores: ${stat.stores}\n`);
    
    // Видаляємо тестові дані
    console.log('🗑️  Видалення тестових даних...\n');
    
    console.log('Видалення тестових QR кодів (TEST_*, ACTIVE_*)...');
    const qrDeleted = await pool.request().query(`
      DELETE FROM AZIT.dbo.QRCodes
      WHERE QRToken LIKE 'TEST_%' OR QRToken LIKE 'ACTIVE_%'
    `);
    console.log(`✓ Видалено: ${qrDeleted.rowsAffected[0]} записів\n`);
    
    console.log('Видалення всіх записів PromotionUsage...');
    const usageDeleted = await pool.request().query(`
      DELETE FROM AZIT.dbo.PromotionUsage
    `);
    console.log(`✓ Видалено: ${usageDeleted.rowsAffected[0]} записів\n`);
    
    console.log('Видалення тестових промоакцій...');
    const promosDeleted = await pool.request().query(`
      DELETE FROM AZIT.dbo.Promotions
    `);
    console.log(`✓ Видалено: ${promosDeleted.rowsAffected[0]} записів\n`);
    
    console.log('Видалення тестових магазинів (STORE_*)...');
    const storesDeleted = await pool.request().query(`
      DELETE FROM AZIT.dbo.Stores
      WHERE StoreId LIKE 'STORE_%'
    `);
    console.log(`✓ Видалено: ${storesDeleted.rowsAffected[0]} записів\n`);
    
    // Показуємо результат
    console.log('📊 Результат:\n');
    
    const finalStats = await pool.request().query(`
      SELECT 
        (SELECT COUNT(*) FROM AZIT.dbo.QRCodes) as qrCodes,
        (SELECT COUNT(*) FROM AZIT.dbo.Promotions) as promotions,
        (SELECT COUNT(*) FROM AZIT.dbo.PromotionUsage) as promotionUsage,
        (SELECT COUNT(*) FROM AZIT.dbo.Stores) as stores
    `);
    
    const finalStat = finalStats.recordset[0];
    console.log(`  QR Codes: ${finalStat.qrCodes}`);
    console.log(`  Promotions: ${finalStat.promotions}`);
    console.log(`  Promotion Usage: ${finalStat.promotionUsage}`);
    console.log(`  Stores: ${finalStat.stores}\n`);
    
    console.log('✅ Всі тестові дані видалено!');
    console.log('💡 Тепер адміністратор може додавати реальні дані через адмін панель\n');
    
  } catch (error: any) {
    console.error('❌ Помилка:', error.message);
    process.exit(1);
  } finally {
    await closeConnection();
    console.log('🔌 З\'єднання закрито');
  }
}

// Запускаємо скрипт
clearTestData()
  .then(() => {
    console.log('\n✨ Готово!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('💥 Фатальна помилка:', err);
    process.exit(1);
  });
