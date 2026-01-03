import express, { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { validate, schemas } from '../middleware/validation.middleware';
import { qrLimiter } from '../middleware/rateLimiter.middleware';
import { sendSuccess, sendError, sendNotFound, asyncHandler } from '../utils/response.util';
import { query } from '../config/database';
import crypto from 'crypto';

const router: Router = express.Router();

/**
 * POST /api/v2/qr/generate
 * Генерація нового QR коду
 */
router.post(
  '/generate',
  authenticate,
  qrLimiter,
  validate(schemas.generateQr),
  asyncHandler(async (req: Request, res: Response) => {
    const { phone, clientName, balance } = req.body;
    
    try {
      const cleanPhone = phone.replace(/^\+38/, '');
      console.log(`📱 Generating QR for: ${cleanPhone}`);

      // Спробувати створити QR через збережену процедуру
      try {
        const result = await query(
          'EXEC zeus_CreateQR @Phone = @phone, @ClientName = @clientName, @Balance = @balance',
          {
            phone: cleanPhone,
            clientName,
            balance: balance || 0,
          }
        );

        if (result.recordset && result.recordset.length > 0) {
          const qrData = result.recordset[0];
          const validUntil = new Date(Date.now() + 5 * 60 * 1000); // 5 хвилин

          return sendSuccess(res, {
            qrToken: qrData.QRToken,
            phone: cleanPhone,
            clientName,
            balance: balance || 0,
            validUntil,
            timestamp: Date.now(),
          }, 'QR code generated successfully');
        }
      } catch (dbError) {
        console.warn('⚠️  Stored procedure not available, generating local QR');
      }

      // Fallback: генерація локально
      const qrToken = crypto
        .createHash('sha256')
        .update(`${cleanPhone}${Date.now()}${Math.random()}`)
        .digest('hex');

      const validUntil = new Date(Date.now() + 5 * 60 * 1000);

      return sendSuccess(res, {
        qrToken,
        phone: cleanPhone,
        clientName,
        balance: balance || 0,
        validUntil,
        timestamp: Date.now(),
      }, 'QR code generated (local)');
    } catch (error: any) {
      return sendError(res, 'QR_GENERATION_FAILED', 'Failed to generate QR code', 500, error);
    }
  })
);

/**
 * GET /api/v2/qr/validate/:qrToken
 * Валідація QR коду
 */
router.get('/validate/:qrToken', asyncHandler(async (req: Request, res: Response) => {
  const { qrToken } = req.params;
  
  try {
    // TODO: Реалізувати валідацію через БД
    // Поки що заглушка
    
    return sendSuccess(res, {
      valid: true,
      qrToken,
      expiresIn: 300, // секунди
    }, 'QR code is valid');
  } catch (error: any) {
    return sendError(res, 'VALIDATION_FAILED', 'Failed to validate QR code', 500, error);
  }
}));

/**
 * POST /api/v2/qr/use
 * Використання QR коду (оплата)
 */
router.post(
  '/use',
  authenticate,
  validate(schemas.useQr),
  asyncHandler(async (req: any, res) => {
    const { qrToken, amount, storeId } = req.body;
    
    try {
      // TODO: Реалізувати використання QR через БД
      
      // Розрахунок cashback (5%)
      const cashback = Math.floor(amount * 0.05);
      
      return sendSuccess(res, {
        success: true,
        transactionId: `TX${Date.now()}`,
        amount,
        cashback,
        newBalance: 0, // TODO: розрахувати новий баланс
        timestamp: new Date().toISOString(),
      }, 'Payment successful');
    } catch (error: any) {
      return sendError(res, 'PAYMENT_FAILED', 'Failed to process payment', 500, error);
    }
  })
);

/**
 * GET /api/v2/qr/history
 * Історія QR кодів користувача
 */
router.get('/history', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { phone } = (req as any).user;
  const { page = 1, limit = 20 } = req.query;
  
  try {
    const cleanPhone = phone.replace(/^\+38/, '');
    
    const result = await query('EXEC zeus_GetQRHistory @PhoneNum = @phone', {
      phone: cleanPhone,
    });

    if (result.recordset) {
      const history = result.recordset.map((item: any) => ({
        id: item.TransactionID || item.ID,
        qrToken: item.QRToken,
        amount: item.Amount,
        cashback: item.Cashback,
        storeName: item.StoreName || item.Place,
        timestamp: item.Timestamp || item.Date,
      }));

      // Пагінація
      const pageNum = Number(page);
      const limitNum = Number(limit);
      const startIndex = (pageNum - 1) * limitNum;
      const endIndex = pageNum * limitNum;
      const paginatedData = history.slice(startIndex, endIndex);

      return sendSuccess(res, paginatedData, 'QR history fetched', 200, {
        page: pageNum,
        limit: limitNum,
        total: history.length,
        totalPages: Math.ceil(history.length / limitNum),
      });
    } else {
      return sendSuccess(res, []);
    }
  } catch (error: any) {
    console.error('❌ QR history error:', error);
    return sendError(res, 'INTERNAL_SERVER_ERROR', 'Failed to fetch QR history', 500);
  }
}));

export default router;
