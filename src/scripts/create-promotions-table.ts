/**
 * Create Promotions Table Script
 * Створює таблицю Promotions для управління промоакціями
 */
import { getConnection, closeConnection } from '../config/database';

async function createPromotionsTable() {
  console.log('🚀 Створення таблиці Promotions...\n');
  
  try {
    const pool = await getConnection();
    console.log('✅ Підключено до SQL Server\n');
    
    // Перевіряємо чи таблиця вже існує
    console.log('🔍 Перевірка існування таблиці...');
    const checkTable = await pool.request().query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_NAME = 'Promotions'
    `);
    
    if (checkTable.recordset.length > 0) {
      console.log('⚠️  Таблиця Promotions вже існує!\n');
      return;
    }
    
    // Створюємо таблицю
    console.log('📝 Створення таблиці Promotions...');
    await pool.request().query(`
      CREATE TABLE [dbo].[Promotions] (
        [Id] INT IDENTITY(1,1) PRIMARY KEY,
        [Code] NVARCHAR(50) NOT NULL UNIQUE,
        [Title] NVARCHAR(200) NOT NULL,
        [Description] NVARCHAR(MAX),
        [DiscountType] NVARCHAR(20) NOT NULL, -- 'percentage' або 'fixed'
        [DiscountValue] DECIMAL(18,2) NOT NULL,
        [MinPurchaseAmount] DECIMAL(18,2) DEFAULT 0,
        [MaxUsageCount] INT NULL, -- NULL = безлімітне використання
        [CurrentUsageCount] INT DEFAULT 0,
        [StartDate] DATETIME NOT NULL,
        [EndDate] DATETIME NOT NULL,
        [IsActive] BIT NOT NULL DEFAULT 1,
        [CreatedAt] DATETIME NOT NULL DEFAULT GETDATE(),
        [UpdatedAt] DATETIME NOT NULL DEFAULT GETDATE(),
        
        CONSTRAINT CK_Promotions_Dates CHECK (EndDate > StartDate),
        CONSTRAINT CK_Promotions_DiscountValue CHECK (DiscountValue > 0),
        CONSTRAINT CK_Promotions_DiscountType CHECK (DiscountType IN ('percentage', 'fixed')),
        CONSTRAINT CK_Promotions_UsageCount CHECK (CurrentUsageCount >= 0)
      )
    `);
    console.log('✅ Таблиця Promotions створена!\n');
    
    // Створюємо індекси
    console.log('📊 Створення індексів...');
    
    await pool.request().query(`
      CREATE UNIQUE INDEX IX_Promotions_Code ON [dbo].[Promotions] (Code)
    `);
    console.log('✓ Індекс IX_Promotions_Code');
    
    await pool.request().query(`
      CREATE INDEX IX_Promotions_IsActive ON [dbo].[Promotions] (IsActive)
    `);
    console.log('✓ Індекс IX_Promotions_IsActive');
    
    await pool.request().query(`
      CREATE INDEX IX_Promotions_Dates ON [dbo].[Promotions] (StartDate, EndDate)
    `);
    console.log('✓ Індекс IX_Promotions_Dates\n');
    
    // Створюємо таблицю для логів використання промокодів
    console.log('📝 Створення таблиці PromotionUsage...');
    await pool.request().query(`
      CREATE TABLE [dbo].[PromotionUsage] (
        [Id] INT IDENTITY(1,1) PRIMARY KEY,
        [PromotionId] INT NOT NULL,
        [PhoneNum] NVARCHAR(20) NOT NULL,
        [QRCodeId] INT NULL,
        [DiscountAmount] DECIMAL(18,2) NOT NULL,
        [OrderAmount] DECIMAL(18,2) NOT NULL,
        [UsedAt] DATETIME NOT NULL DEFAULT GETDATE(),
        
        CONSTRAINT FK_PromotionUsage_Promotion FOREIGN KEY (PromotionId) 
          REFERENCES [dbo].[Promotions](Id),
        CONSTRAINT FK_PromotionUsage_QRCode FOREIGN KEY (QRCodeId) 
          REFERENCES [dbo].[QRCodes](Id)
      )
    `);
    console.log('✅ Таблиця PromotionUsage створена!\n');
    
    await pool.request().query(`
      CREATE INDEX IX_PromotionUsage_Phone ON [dbo].[PromotionUsage] (PhoneNum)
    `);
    console.log('✓ Індекс IX_PromotionUsage_Phone');
    
    await pool.request().query(`
      CREATE INDEX IX_PromotionUsage_Promotion ON [dbo].[PromotionUsage] (PromotionId)
    `);
    console.log('✓ Індекс IX_PromotionUsage_Promotion\n');
    
    // Додаємо тестові промоакції
    console.log('📝 Додавання тестових промоакцій...\n');
    
    const testPromotions = [
      {
        code: 'NEWYEAR2025',
        title: 'Новорічна знижка 2025',
        description: 'Спеціальна новорічна пропозиція - знижка 15% на всі покупки',
        discountType: 'percentage',
        discountValue: 15,
        minPurchase: 500,
        maxUsage: 100,
        startDate: '2025-01-01',
        endDate: '2025-01-31'
      },
      {
        code: 'WELCOME500',
        title: 'Вітальний бонус',
        description: 'Знижка 500 грн для нових клієнтів при покупці від 2000 грн',
        discountType: 'fixed',
        discountValue: 500,
        minPurchase: 2000,
        maxUsage: null,
        startDate: '2025-01-01',
        endDate: '2025-12-31'
      },
      {
        code: 'LOYALTY20',
        title: 'Бонус для постійних клієнтів',
        description: '20% знижка для власників карти лояльності',
        discountType: 'percentage',
        discountValue: 20,
        minPurchase: 1000,
        maxUsage: null,
        startDate: '2025-01-01',
        endDate: '2025-12-31'
      },
      {
        code: 'WEEKEND10',
        title: 'Вихідна знижка',
        description: '10% знижка на всі покупки у вихідні',
        discountType: 'percentage',
        discountValue: 10,
        minPurchase: 0,
        maxUsage: null,
        startDate: '2025-01-01',
        endDate: '2025-12-31'
      }
    ];
    
    for (const promo of testPromotions) {
      await pool.request().query(`
        INSERT INTO [dbo].[Promotions] (
          Code, Title, Description, DiscountType, DiscountValue,
          MinPurchaseAmount, MaxUsageCount, StartDate, EndDate, IsActive
        ) VALUES (
          '${promo.code}',
          '${promo.title}',
          '${promo.description}',
          '${promo.discountType}',
          ${promo.discountValue},
          ${promo.minPurchase},
          ${promo.maxUsage ? promo.maxUsage : 'NULL'},
          '${promo.startDate}',
          '${promo.endDate}',
          1
        )
      `);
      console.log(`✓ ${promo.code} - ${promo.title}`);
    }
    
    // Перевіряємо результат
    console.log('\n📊 Результат:\n');
    
    const verify = await pool.request().query(`
      SELECT 
        COUNT(*) as totalPromotions,
        COUNT(CASE WHEN IsActive = 1 THEN 1 END) as activePromotions,
        COUNT(CASE WHEN GETDATE() BETWEEN StartDate AND EndDate THEN 1 END) as currentPromotions
      FROM [dbo].[Promotions]
    `);
    
    const stat = verify.recordset[0];
    console.log(`📋 Всього промоакцій: ${stat.totalPromotions}`);
    console.log(`✅ Активних: ${stat.activePromotions}`);
    console.log(`🟢 Поточних (в межах дат): ${stat.currentPromotions}`);
    
    // Показуємо всі промоакції
    console.log('\n📝 Список промоакцій:\n');
    const promos = await pool.request().query(`
      SELECT 
        Code,
        Title,
        DiscountType,
        DiscountValue,
        MinPurchaseAmount,
        MaxUsageCount,
        CurrentUsageCount,
        FORMAT(StartDate, 'yyyy-MM-dd') as StartDate,
        FORMAT(EndDate, 'yyyy-MM-dd') as EndDate
      FROM [dbo].[Promotions]
      ORDER BY CreatedAt DESC
    `);
    
    promos.recordset.forEach((p: any) => {
      const discount = p.DiscountType === 'percentage' 
        ? `${p.DiscountValue}%` 
        : `${p.DiscountValue} грн`;
      const usage = p.MaxUsageCount 
        ? `${p.CurrentUsageCount}/${p.MaxUsageCount}` 
        : 'необмежено';
      console.log(`  ${p.Code} - ${discount} (${usage})`);
      console.log(`    ${p.Title}`);
      console.log(`    Мін. сума: ${p.MinPurchaseAmount} грн`);
      console.log(`    Період: ${p.StartDate} - ${p.EndDate}\n`);
    });
    
  } catch (error: any) {
    console.error('❌ Помилка:', error.message);
    process.exit(1);
  } finally {
    await closeConnection();
    console.log('🔌 З\'єднання закрито');
  }
}

// Запускаємо скрипт
createPromotionsTable()
  .then(() => {
    console.log('\n✨ Готово!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('💥 Фатальна помилка:', err);
    process.exit(1);
  });
