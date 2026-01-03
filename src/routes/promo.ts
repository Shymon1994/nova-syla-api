/**
 * Promo Routes - API endpoints для роботи з промокодами
 */
import { Router, Request, Response } from 'express';
import { getConnection } from '../config/database';

const router = Router();

// POST /api/promo/apply - Застосувати промо-код
router.post('/apply', async (req: Request, res: Response) => {
  try {
    const { code, phone } = req.body;
    
    if (!code || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Не вказано код або телефон',
      });
    }
    
    const promoCode = code.toUpperCase().trim();
    const pool = await getConnection();
    
    // Перевіряємо чи існує промо-код
    const promoResult = await pool
      .request()
      .query(`
        SELECT 
          Id,
          Code,
          Title,
          Description,
          DiscountType,
          DiscountValue,
          MinPurchaseAmount,
          MaxUsageCount,
          CurrentUsageCount,
          StartDate,
          EndDate,
          IsActive
        FROM AZIT.dbo.Promotions
        WHERE Code = '${promoCode}'
      `);
    
    if (promoResult.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: '❌ Промо-код не знайдено',
      });
    }
    
    const promo = promoResult.recordset[0];
    
    // Перевіряємо чи активний
    if (!promo.IsActive) {
      return res.status(400).json({
        success: false,
        message: '❌ Промо-код неактивний',
      });
    }
    
    // Перевіряємо дати
    const now = new Date();
    const startDate = new Date(promo.StartDate);
    const endDate = new Date(promo.EndDate);
    
    if (now < startDate) {
      return res.status(400).json({
        success: false,
        message: '❌ Промо-код ще не активний',
      });
    }
    
    if (now > endDate) {
      return res.status(400).json({
        success: false,
        message: '❌ Термін дії промо-коду закінчився',
      });
    }
    
    // Перевіряємо ліміт використань
    if (promo.MaxUsageCount !== null && promo.CurrentUsageCount >= promo.MaxUsageCount) {
      return res.status(400).json({
        success: false,
        message: '❌ Промо-код вичерпано',
      });
    }
    
    // Перевіряємо чи користувач вже використав цей промо-код
    const usageCheck = await pool
      .request()
      .query(`
        SELECT COUNT(*) as count
        FROM AZIT.dbo.PromotionUsage
        WHERE PromotionId = ${promo.Id} AND PhoneNum = '${phone}'
      `);
    
    if (usageCheck.recordset[0].count > 0) {
      return res.status(400).json({
        success: false,
        message: '❌ Ви вже використали цей промо-код',
      });
    }
    
    // Повертаємо інформацію про знижку
    // Реальне застосування буде в момент оплати
    res.json({
      success: true,
      message: `✅ Промо-код "${promo.Title}" застосовано!`,
      data: {
        code: promo.Code,
        title: promo.Title,
        description: promo.Description,
        discountType: promo.DiscountType,
        discount: promo.DiscountValue,
        minPurchase: promo.MinPurchaseAmount || 0,
      },
    });
    
  } catch (error: any) {
    console.error('❌ Apply promo error:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка сервера',
      error: error.message,
    });
  }
});

// GET /api/promo/available - Отримати список доступних промо-кодів
router.get('/available', async (req: Request, res: Response) => {
  try {
    const pool = await getConnection();
    
    // Отримуємо всі активні промоакції в межах дат
    const result = await pool
      .request()
      .query(`
        SELECT 
          Code,
          Title,
          Description,
          DiscountType,
          DiscountValue,
          MinPurchaseAmount,
          MaxUsageCount,
          CurrentUsageCount
        FROM AZIT.dbo.Promotions
        WHERE 
          IsActive = 1 
          AND GETDATE() BETWEEN StartDate AND EndDate
          AND (MaxUsageCount IS NULL OR CurrentUsageCount < MaxUsageCount)
        ORDER BY CreatedAt DESC
      `);
    
    const promos = result.recordset.map((row: any) => {
      const discount = row.DiscountType === 'percentage' 
        ? `${row.DiscountValue}%` 
        : `${row.DiscountValue} грн`;
      
      return {
        code: row.Code,
        title: row.Title,
        description: row.Description || '',
        discount: discount,
        discountType: row.DiscountType,
        discountValue: row.DiscountValue,
        minPurchase: row.MinPurchaseAmount || 0,
        usageLimit: row.MaxUsageCount 
          ? `${row.CurrentUsageCount}/${row.MaxUsageCount}` 
          : 'Необмежено',
      };
    });
    
    res.json({
      success: true,
      data: promos,
    });
    
  } catch (error: any) {
    console.error('❌ Get available promos error:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка сервера',
      error: error.message,
    });
  }
});

export default router;
