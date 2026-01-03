/**
 * Database Setup Script
 * Виконує database_setup.sql для створення таблиці QRCodes
 */
import fs from 'fs';
import path from 'path';
import { getConnection, closeConnection } from '../config/database';

async function setupDatabase() {
  console.log('🚀 Початок налаштування бази даних...\n');
  
  try {
    // Читаємо SQL файл
    const sqlFilePath = path.join(__dirname, '../../database_setup.sql');
    console.log(`📄 Читання файлу: ${sqlFilePath}`);
    
    const sqlScript = fs.readFileSync(sqlFilePath, 'utf-8');
    
    // Отримуємо підключення
    const pool = await getConnection();
    console.log('✅ Підключено до SQL Server\n');
    
    // Розділяємо скрипт на окремі команди (по GO)
    const commands = sqlScript
      .split(/\nGO\n|\nGO\r\n/gi)
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));
    
    console.log(`📋 Знайдено ${commands.length} команд для виконання\n`);
    
    // Виконуємо кожну команду окремо
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      
      // Пропускаємо коментарі та порожні рядки
      if (command.trim().startsWith('--') || command.trim().length === 0) {
        continue;
      }
      
      try {
        console.log(`⏳ Виконання команди ${i + 1}/${commands.length}...`);
        const result = await pool.request().query(command);
        
        // Виводимо повідомлення з SQL (PRINT statements)
        if (result.recordset && result.recordset.length > 0) {
          console.log('   ✓ Результат:', result.recordset);
        } else {
          console.log('   ✓ Виконано успішно');
        }
      } catch (err: any) {
        // Ігноруємо помилки про існуючі об'єкти
        if (err.message.includes('already exists') || 
            err.message.includes('вже існує')) {
          console.log(`   ⚠ Об'єкт вже існує (пропускаємо)`);
        } else {
          console.error(`   ❌ Помилка:`, err.message);
          // Не зупиняємося, продовжуємо виконання інших команд
        }
      }
    }
    
    console.log('\n✅ Налаштування бази даних завершено!');
    console.log('\n📊 Перевірка створених об\'єктів...');
    
    // Перевіряємо створену таблицю
    const checkTable = await pool.request().query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_NAME = 'QRCodes'
    `);
    
    if (checkTable.recordset.length > 0) {
      console.log('✓ Таблиця QRCodes існує');
      
      // Отримуємо кількість записів
      const countResult = await pool.request().query(`
        SELECT COUNT(*) as total FROM AZIT.dbo.QRCodes
      `);
      console.log(`✓ Записів у таблиці: ${countResult.recordset[0].total}`);
    } else {
      console.log('❌ Таблиця QRCodes НЕ створена!');
    }
    
    // Перевіряємо stored procedures
    const checkProcs = await pool.request().query(`
      SELECT ROUTINE_NAME 
      FROM INFORMATION_SCHEMA.ROUTINES 
      WHERE ROUTINE_TYPE = 'PROCEDURE' 
      AND ROUTINE_NAME LIKE 'zeus_%'
      ORDER BY ROUTINE_NAME
    `);
    
    if (checkProcs.recordset.length > 0) {
      console.log(`✓ Знайдено ${checkProcs.recordset.length} stored procedures:`);
      checkProcs.recordset.forEach((proc: any) => {
        console.log(`  - ${proc.ROUTINE_NAME}`);
      });
    }
    
  } catch (error: any) {
    console.error('❌ Критична помилка:', error.message);
    process.exit(1);
  } finally {
    await closeConnection();
    console.log('\n🔌 З\'єднання закрито');
  }
}

// Запускаємо скрипт
setupDatabase()
  .then(() => {
    console.log('\n✨ Готово!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('💥 Фатальна помилка:', err);
    process.exit(1);
  });
