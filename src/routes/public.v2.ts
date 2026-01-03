import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { getConnection } from '../config/database';
import { sendSuccess, sendError } from '../utils/response.util';
import sql from 'mssql';

const router = Router();

// ===== Публічна інформація про програму лояльності =====
router.get('/info', async (req: Request, res: Response) => {
  try {
    sendSuccess(res, {
      programName: 'Nova Syla Loyalty',
      description: 'Програма лояльності для мережі магазинів Нова Сила',
      features: [
        'Накопичення бонусів за кожну покупку',
        'QR-код для швидкої оплати',
        'Персональні промоакції',
        'Історія транзакцій',
        'Кешбек від покупок'
      ],
      levels: [
        { name: 'Бронза', minBalance: 0, cashbackPercent: 5 },
        { name: 'Срібло', minBalance: 1000, cashbackPercent: 7 },
        { name: 'Золото', minBalance: 5000, cashbackPercent: 10 },
        { name: 'Платина', minBalance: 10000, cashbackPercent: 15 }
      ],
      contact: {
        phone: '+380 (44) 123-45-67',
        email: 'support@novasyla.ua',
        website: 'https://novasyla.ua'
      }
    });
  } catch (error) {
    console.error('❌ Error getting program info:', error);
    sendError(res, 'INTERNAL_SERVER_ERROR', 'Failed to get program info');
  }
});

// ===== Список магазинів (публічний) =====
router.get('/stores', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const offset = (page - 1) * limit;

    const pool = await getConnection();
    const result = await pool.request()
      .input('offset', sql.Int, offset)
      .input('limit', sql.Int, limit)
      .query(`SELECT 
        StoreID,
        StoreName,
        Address,
        City,
        Phone,
        WorkingHours,
        Latitude,
        Longitude
      FROM Stores 
      WHERE IsActive = 1
      ORDER BY City, StoreName
      OFFSET @offset ROWS
      FETCH NEXT @limit ROWS ONLY`);

    const countResult = await pool.request()
      .query('SELECT COUNT(*) as total FROM Stores WHERE IsActive = 1');

    const total = countResult.recordset[0].total;

    sendSuccess(res, {
      stores: result.recordset,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('❌ Error fetching stores:', error);
    sendError(res, 'INTERNAL_SERVER_ERROR', 'Failed to fetch stores');
  }
});

// ===== Активні промоакції (публічні) =====
router.get('/promotions', async (req: Request, res: Response) => {
  try {
    const pool = await getConnection();
    // Використовуємо SELECT * щоб отримати всі доступні колонки
    const result = await pool.request()
      .query(`SELECT TOP 0 *
      FROM Promotions 
      WHERE 1=0`);

    sendSuccess(res, {
      promotions: [] // Поки що повертаємо порожній масив
    });
  } catch (error) {
    console.error('❌ Error fetching promotions:', error);
    sendError(res, 'INTERNAL_SERVER_ERROR', 'Failed to fetch promotions');
  }
});

// ===== Перевірка доступності номера телефону =====
const checkPhoneSchema = z.object({
  phone: z.string().regex(/^\+380\d{9}$/, 'Invalid phone format')
});

router.post('/check-phone', async (req: Request, res: Response) => {
  try {
    const validation = checkPhoneSchema.safeParse(req.body);
    
    if (!validation.success) {
      return sendError(
        res,
        'VALIDATION_ERROR',
        'Invalid phone number format',
        400,
        validation.error.errors
      );
    }

    const { phone } = validation.data;

    const pool = await getConnection();
    const result = await pool.request()
      .input('phone', sql.NVarChar, phone)
      .query('SELECT PhoneNum FROM Clients WHERE PhoneNum = @phone');

    const exists = result.recordset.length > 0;

    sendSuccess(res, {
      phone,
      exists,
      message: exists 
        ? 'Цей номер вже зареєстрований' 
        : 'Номер доступний для реєстрації'
    });
  } catch (error) {
    console.error('❌ Error checking phone:', error);
    sendError(res, 'INTERNAL_SERVER_ERROR', 'Failed to check phone availability');
  }
});

// ===== Перевірка QR коду (для касирів без авторизації) =====
router.get('/qr/validate/:token', async (req: Request, res: Response) => {
  try {
    const { token } = req.params;

    if (!token || token.length !== 64) {
      return sendError(res, 'VALIDATION_ERROR', 'Invalid QR code format', 400);
    }

    const pool = await getConnection();
    const result = await pool.request()
      .input('token', sql.NVarChar, token)
      .query(`SELECT 
        q.PhoneNum,
        q.ExpiresAt,
        q.IsUsed,
        c.Name,
        c.BonusAccount
      FROM QRCodes q
      LEFT JOIN Clients c ON c.PhoneNum = q.PhoneNum
      WHERE q.QRToken = @token`);

    if (result.recordset.length === 0) {
      return sendError(res, 'NOT_FOUND', 'QR code not found', 404);
    }

    const qr = result.recordset[0];

    // Перевірка терміну дії
    if (new Date(qr.ExpiresAt) < new Date()) {
      return sendError(res, 'QR_EXPIRED', 'QR code has expired', 400);
    }

    // Перевірка чи не використаний
    if (qr.IsUsed) {
      return sendError(res, 'QR_ALREADY_USED', 'QR code has already been used', 400);
    }

    sendSuccess(res, {
      valid: true,
      client: {
        phone: qr.PhoneNum,
        name: qr.Name || 'Клієнт Нова Сила',
        balance: qr.BonusAccount || 0
      },
      expiresAt: qr.ExpiresAt
    });
  } catch (error) {
    console.error('❌ Error validating QR:', error);
    sendError(res, 'INTERNAL_SERVER_ERROR', 'Failed to validate QR code');
  }
});

// ===== Статистика програми (загальна, без персональних даних) =====
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const pool = await getConnection();
    
    // Загальна кількість користувачів
    const usersResult = await pool.request()
      .query('SELECT COUNT(*) as total FROM Clients');

    // Загальна сума нарахованих бонусів
    const bonusResult = await pool.request()
      .query('SELECT SUM(BonusAccount) as totalBonuses FROM Clients');

    // Кількість активних промоакцій
    const promosResult = await pool.request()
      .query(`SELECT COUNT(*) as activePromos 
       FROM Promotions 
       WHERE IsActive = 1 
         AND StartDate <= GETDATE() 
         AND EndDate >= GETDATE()`);

    // Кількість магазинів
    const storesResult = await pool.request()
      .query('SELECT COUNT(*) as totalStores FROM Stores WHERE IsActive = 1');

    sendSuccess(res, {
      users: usersResult.recordset[0].total || 0,
      totalBonuses: bonusResult.recordset[0].totalBonuses || 0,
      activePromotions: promosResult.recordset[0].activePromos || 0,
      stores: storesResult.recordset[0].totalStores || 0,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error fetching stats:', error);
    sendError(res, 'INTERNAL_SERVER_ERROR', 'Failed to fetch statistics');
  }
});

// ===== Пошук магазинів за містом =====
router.get('/stores/city/:city', async (req: Request, res: Response) => {
  try {
    const { city } = req.params;

    const pool = await getConnection();
    const result = await pool.request()
      .input('city', sql.NVarChar, `%${city}%`)
      .query(`SELECT 
        StoreID,
        StoreName,
        Address,
        City,
        Phone,
        WorkingHours,
        Latitude,
        Longitude
      FROM Stores 
      WHERE IsActive = 1 
        AND City LIKE @city
      ORDER BY StoreName`);

    sendSuccess(res, {
      city,
      stores: result.recordset,
      count: result.recordset.length
    });
  } catch (error) {
    console.error('❌ Error searching stores:', error);
    sendError(res, 'INTERNAL_SERVER_ERROR', 'Failed to search stores');
  }
});

// ===== Найближчі магазини (за координатами) =====
router.get('/stores/nearby', async (req: Request, res: Response) => {
  try {
    const lat = parseFloat(req.query.lat as string);
    const lng = parseFloat(req.query.lng as string);
    const radius = parseInt(req.query.radius as string) || 10; // км

    if (isNaN(lat) || isNaN(lng)) {
      return sendError(res, 'VALIDATION_ERROR', 'Invalid coordinates', 400);
    }

    const pool = await getConnection();
    const result = await pool.request()
      .input('lat', sql.Float, lat)
      .input('lng', sql.Float, lng)
      .input('radius', sql.Float, radius)
      .query(`SELECT TOP 10
        StoreID,
        StoreName,
        Address,
        City,
        Phone,
        WorkingHours,
        Latitude,
        Longitude,
        (
          6371 * 
          ACOS(
            COS(RADIANS(@lat)) * 
            COS(RADIANS(Latitude)) * 
            COS(RADIANS(Longitude) - RADIANS(@lng)) + 
            SIN(RADIANS(@lat)) * 
            SIN(RADIANS(Latitude))
          )
        ) AS distance
      FROM Stores 
      WHERE IsActive = 1
        AND Latitude IS NOT NULL
        AND Longitude IS NOT NULL
      HAVING distance <= @radius
      ORDER BY distance`);

    sendSuccess(res, {
      location: { lat, lng },
      radius,
      stores: result.recordset.map((store: any) => ({
        ...store,
        distance: Math.round(store.distance * 100) / 100 // округлення до 2 знаків
      }))
    });
  } catch (error) {
    console.error('❌ Error finding nearby stores:', error);
    sendError(res, 'INTERNAL_SERVER_ERROR', 'Failed to find nearby stores');
  }
});

export default router;
