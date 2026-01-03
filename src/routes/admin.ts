import { Router, Request, Response } from 'express';
import { getConnection } from '../config/database';

const router = Router();

// GET /api/admin/stats - Отримати статистику
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const pool = await getConnection();
    
    // Реальна кількість клієнтів з QRCodes
    const clientsResult = await pool
      .request()
      .query(`
        SELECT COUNT(DISTINCT PhoneNum) as total
        FROM AZIT.dbo.QRCodes
        WHERE PhoneNum IS NOT NULL
      `);
    
    const totalClients = clientsResult.recordset[0]?.total || 0;
    
    // Реальна кількість транзакцій
    const transResult = await pool
      .request()
      .query(`
        SELECT COUNT(*) as total
        FROM AZIT.dbo.QRCodes
        WHERE TransactionAmount IS NOT NULL
      `);
    
    const totalTransactions = transResult.recordset[0]?.total || 0;
    
    // Реальна кількість QR кодів
    const qrResult = await pool
      .request()
      .query(`
        SELECT COUNT(*) as total
        FROM AZIT.dbo.QRCodes
      `);
    
    const totalQRCodes = qrResult.recordset[0]?.total || 0;
    
    // Сума транзакцій
    const revenueResult = await pool
      .request()
      .query(`
        SELECT ISNULL(SUM(TransactionAmount), 0) as total
        FROM AZIT.dbo.QRCodes
        WHERE TransactionAmount IS NOT NULL AND IsUsed = 1
      `);
    
    const totalRevenue = revenueResult.recordset[0]?.total || 0;
    
    // Кількість активних промоакцій
    const promoResult = await pool
      .request()
      .query(`
        SELECT COUNT(*) as total
        FROM AZIT.dbo.Promotions
        WHERE IsActive = 1 AND GETDATE() BETWEEN StartDate AND EndDate
      `);
    
    const activePromotions = promoResult.recordset[0]?.total || 0;
    
    const stats = {
      totalUsers: totalClients,
      activeUsers: totalClients, // Всі користувачі які створили QR - активні
      totalTransactions: totalTransactions,
      totalQRScans: totalQRCodes,
      activePromotions: activePromotions,
      totalRevenue: Math.floor(totalRevenue),
    };
    
    res.json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    console.error('❌ Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка сервера',
      error: error.message,
    });
  }
});

// GET /api/admin/users - Отримати список користувачів
router.get('/users', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;
    
    // Отримуємо реальних користувачів з таблиці QRCodes
    const pool = await getConnection();
    
    // Поділена статистика по користувачам з таблиці QRCodes
    const result = await pool
      .request()
      .query(`
        SELECT DISTINCT
          ROW_NUMBER() OVER (ORDER BY MAX(CreatedAt) DESC) as RowNum,
          PhoneNum as phone,
          ClientName as fullName,
          MAX(Balance) as balance,
          MAX(CreatedAt) as lastActive,
          COUNT(*) as totalQRs
        FROM AZIT.dbo.QRCodes
        WHERE PhoneNum IS NOT NULL AND ClientName IS NOT NULL
        GROUP BY PhoneNum, ClientName
        ORDER BY lastActive DESC
        OFFSET ${offset} ROWS
        FETCH NEXT ${limit} ROWS ONLY
      `);
    
    // Отримуємо загальну кількість
    const countResult = await pool
      .request()
      .query(`
        SELECT COUNT(DISTINCT PhoneNum) as total
        FROM AZIT.dbo.QRCodes
        WHERE PhoneNum IS NOT NULL AND ClientName IS NOT NULL
      `);
    
    const total = countResult.recordset[0]?.total || 0;
    
    const users = result.recordset.map((row: any) => {
      let name = row.phone;
      if (row.fullName) {
        // Видаляємо текст в дужках (напр. "Менеджер")
        name = row.fullName.replace(/\s*\([^)]*\)\s*/g, '').trim();
      }
      
      // Визначаємо рівень на основі балансу
      let level = 'Бронза';
      if (row.balance >= 500) level = 'Платина';
      else if (row.balance >= 300) level = 'Золото';
      else if (row.balance >= 100) level = 'Срібло';
      
      return {
        clientId: row.RowNum.toString(),
        phone: row.phone,
        name: name,
        balance: row.balance || 0,
        level: level,
        lastActive: row.lastActive ? new Date(row.lastActive).toISOString() : new Date().toISOString(),
      };
    });
    
    res.json({
      success: true,
      data: {
        users,
        page,
        limit,
        total: total,
      },
    });
  } catch (error: any) {
    console.error('❌ Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка сервера',
      error: error.message,
    });
  }
});

// GET /api/admin/promotions - Отримати список акцій
router.get('/promotions', async (req: Request, res: Response) => {
  try {
    const pool = await getConnection();
    
    // Отримуємо всі промоакції
    const result = await pool
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
          IsActive,
          CreatedAt
        FROM AZIT.dbo.Promotions
        ORDER BY CreatedAt DESC
      `);
    
    const promotions = result.recordset.map((row: any) => {
      // Перевіряємо чи акція в межах дат
      const now = new Date();
      const startDate = new Date(row.StartDate);
      const endDate = new Date(row.EndDate);
      const isInDateRange = now >= startDate && now <= endDate;
      
      return {
        id: row.Id.toString(),
        code: row.Code,
        title: row.Title,
        description: row.Description || '',
        discount: row.DiscountType === 'percentage' 
          ? `${row.DiscountValue}%` 
          : `${row.DiscountValue} грн`,
        discountType: row.DiscountType,
        discountValue: row.DiscountValue,
        minPurchase: row.MinPurchaseAmount || 0,
        usageCount: row.CurrentUsageCount || 0,
        maxUsage: row.MaxUsageCount,
        usageLimit: row.MaxUsageCount ? `${row.CurrentUsageCount}/${row.MaxUsageCount}` : 'Необмежено',
        startDate: row.StartDate ? new Date(row.StartDate).toISOString() : null,
        endDate: row.EndDate ? new Date(row.EndDate).toISOString() : null,
        isActive: row.IsActive && isInDateRange,
        status: row.IsActive && isInDateRange ? 'active' : 'inactive',
      };
    });
    
    res.json({
      success: true,
      data: promotions,
    });
  } catch (error: any) {
    console.error('❌ Get promotions error:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка сервера',
      error: error.message,
    });
  }
});

// POST /api/admin/promotions - Створити нову акцію
router.post('/promotions', async (req: Request, res: Response) => {
  try {
    const { title, description, discount, startDate, endDate } = req.body;
    
    // TODO: Зберегти в базу даних
    const newPromotion = {
      id: Date.now().toString(),
      title,
      description,
      discount: discount || 0,
      startDate,
      endDate,
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    
    res.json({
      success: true,
      data: newPromotion,
      message: 'Акцію успішно створено',
    });
  } catch (error: any) {
    console.error('❌ Create promotion error:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка сервера',
      error: error.message,
    });
  }
});

// DELETE /api/admin/promotions/:id - Видалити акцію
router.delete('/promotions/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // TODO: Видалити з бази даних
    
    res.json({
      success: true,
      message: 'Акцію успішно видалено',
    });
  } catch (error: any) {
    console.error('❌ Delete promotion error:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка сервера',
      error: error.message,
    });
  }
});

// GET /api/admin/transactions - Отримати історію транзакцій
router.get('/transactions', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = (page - 1) * limit;
    
    // Отримуємо реальні транзакції з таблиці QRCodes
    const pool = await getConnection();
    
    const result = await pool
      .request()
      .query(`
        SELECT
          qr.Id as id,
          qr.PhoneNum as phone,
          qr.ClientName as clientName,
          qr.TransactionAmount as amount,
          CASE 
            WHEN qr.IsUsed = 1 THEN 'spend'
            ELSE 'earn'
          END as type,
          CASE
            WHEN qr.UsedAt IS NOT NULL THEN qr.UsedAt
            ELSE qr.CreatedAt
          END as date,
          CASE
            WHEN qr.IsUsed = 1 THEN 'Списання бонусів'
            ELSE 'Нарахування бонусів'
          END as description,
          qr.StoreId,
          s.StoreName,
          s.City
        FROM AZIT.dbo.QRCodes qr
        LEFT JOIN AZIT.dbo.Stores s ON qr.StoreId = s.StoreId
        WHERE qr.TransactionAmount IS NOT NULL
        ORDER BY 
          CASE
            WHEN qr.UsedAt IS NOT NULL THEN qr.UsedAt
            ELSE qr.CreatedAt
          END DESC
        OFFSET ${offset} ROWS
        FETCH NEXT ${limit} ROWS ONLY
      `);
    
    // Отримуємо загальну кількість
    const countResult = await pool
      .request()
      .query(`
        SELECT COUNT(*) as total
        FROM AZIT.dbo.QRCodes
        WHERE TransactionAmount IS NOT NULL
      `);
    
    const total = countResult.recordset[0]?.total || 0;
    
    const transactions = result.recordset.map((row: any) => ({
      id: `txn_${row.id}`,
      clientId: row.phone,
      clientName: row.clientName || row.phone,
      amount: row.amount || 0,
      type: row.type,
      date: row.date ? new Date(row.date).toISOString() : new Date().toISOString(),
      description: row.description,
      storeId: row.StoreId || null,
      storeName: row.StoreName || null,
      city: row.City || null,
    }));
    
    res.json({
      success: true,
      data: {
        transactions,
        page,
        limit,
        total: total,
      },
    });
  } catch (error: any) {
    console.error('❌ Get transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка сервера',
      error: error.message,
    });
  }
});

export default router;
