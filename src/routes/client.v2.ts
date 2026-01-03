import express, { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { validate, schemas } from '../middleware/validation.middleware';
import { sendSuccess, sendError, sendNotFound, asyncHandler } from '../utils/response.util';
import { query, getConnection } from '../config/database';

const router: Router = express.Router();

/**
 * GET /api/v2/client/me
 * Отримати дані поточного користувача
 */
router.get('/me', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { phone } = (req as any).user;
  
  try {
    const pool = await getConnection();
    const result = await pool.request()
      .input('PhoneNum', phone)
      .query('SELECT PhoneNum, Name, Email, City, BonusAccount, ISNULL(IsAdmin, 0) as IsAdmin FROM Clients WHERE PhoneNum = @PhoneNum');

    if (result.recordset && result.recordset.length > 0) {
      const client = result.recordset[0];
      
      return sendSuccess(res, {
        phone: client.PhoneNum,
        name: client.Name,
        email: client.Email,
        city: client.City,
        balance: client.BonusAccount || 0,
        isAdmin: Boolean(client.IsAdmin),
      });
    } else {
      return sendNotFound(res, 'Client not found');
    }
  } catch (error: any) {
    console.error('❌ Error fetching client data:', error);
    return sendError(res, 'DATABASE_ERROR', 'Failed to fetch client data', 500, error);
  }
}));

/**
 * GET /api/v2/client/:phone
 * Отримати дані клієнта за телефоном (публічний, обмежена інформація)
 */
router.get('/:phone', asyncHandler(async (req: Request, res: Response) => {
  const { phone } = req.params;
  const cleanPhone = phone.replace(/^\+38/, '');
  
  try {
    const result = await query('EXEC zeus_GetCli @Phone = @phone', {
      phone: cleanPhone,
    });

    if (result.recordset && result.recordset.length > 0) {
      const client = result.recordset[0];
      
      // Повертаємо тільки публічну інформацію
      return sendSuccess(res, {
        name: client.ClientName,
        level: client.Level || 'Бронза',
        // Баланс та інші чутливі дані не показуємо
      });
    } else {
      return sendNotFound(res, 'Client not found');
    }
  } catch (error: any) {
    return sendError(res, 'DATABASE_ERROR', 'Failed to fetch client data', 500, error);
  }
}));

/**
 * PUT /api/v2/client/me
 * Оновити дані користувача
 */
router.put(
  '/me',
  authenticate,
  validate(schemas.updateClient),
  asyncHandler(async (req: Request, res: Response) => {
    const { phone } = (req as any).user;
    const { name, email, city } = req.body;
    
    try {
      const pool = await getConnection();
      const result = await pool.request()
        .input('PhoneNum', phone)
        .input('Name', name || null)
        .input('Email', email || null)
        .input('City', city || null)
        .execute('zeus_UpdateClientProfile');
      
      if (result.recordset && result.recordset.length > 0) {
        const user = result.recordset[0];
        return sendSuccess(res, {
          phone: user.PhoneNum,
          name: user.Name,
          email: user.Email,
          city: user.City,
          balance: user.BonusAccount,
          isAdmin: Boolean(user.IsAdmin),
        }, 'Profile updated successfully');
      }
      
      return sendError(res, 'UPDATE_FAILED', 'Failed to update profile', 500);
    } catch (error: any) {
      console.error('❌ Error updating profile:', error);
      return sendError(res, 'UPDATE_FAILED', 'Failed to update profile', 500, error);
    }
  })
);

/**
 * GET /api/v2/client/me/balance
 * Отримати баланс користувача
 */
router.get('/me/balance', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { phone } = (req as any).user;
  
  try {
    const result = await query('EXEC zeus_GetCli @Phone = @phone', {
      phone: phone.replace(/^\+38/, ''),
    });

    if (result.recordset && result.recordset.length > 0) {
      const client = result.recordset[0];
      
      return sendSuccess(res, {
        balance: client.Balance || 0,
        level: client.Level || 'Бронза',
      });
    } else {
      return sendNotFound(res, 'Client not found');
    }
  } catch (error: any) {
    return sendError(res, 'DATABASE_ERROR', 'Failed to fetch balance', 500, error);
  }
}));

/**
 * GET /api/v2/client/me/transactions
 * Отримати історію транзакцій користувача
 */
router.get('/me/transactions', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { phone } = (req as any).user;
  const { page = 1, limit = 20 } = req.query;
  
  try {
    const cleanPhone = phone.replace(/^\+38/, '');
    
    // Спробувати отримати історію з БД
    const result = await query('EXEC zeus_GetQRHistory @Phone = @phone', {
      phone: cleanPhone,
    });

    if (result.recordset) {
      const transactions = result.recordset.map((tx: any) => ({
        id: tx.TransactionID,
        qrToken: tx.QRToken,
        amount: tx.Amount,
        cashback: tx.Cashback,
        storeName: tx.StoreName,
        timestamp: tx.Timestamp,
      }));

      // Пагінація
      const pageNum = Number(page);
      const limitNum = Number(limit);
      const startIndex = (pageNum - 1) * limitNum;
      const endIndex = pageNum * limitNum;
      const paginatedData = transactions.slice(startIndex, endIndex);

      return sendSuccess(res, paginatedData, 'Transactions fetched', 200, {
        page: pageNum,
        limit: limitNum,
        total: transactions.length,
        totalPages: Math.ceil(transactions.length / limitNum),
      });
    } else {
      return sendSuccess(res, [], 'No transactions found');
    }
  } catch (error: any) {
    // Якщо БД не доступна, повернути порожній масив
    return sendSuccess(res, [], 'No transactions available');
  }
}));

export default router;
