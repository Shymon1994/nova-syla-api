import { Router, Request, Response } from 'express';
import { getConnection } from '../config/database';
import crypto from 'crypto';
import sql from 'mssql';

const router = Router();

interface QRGenerateRequest {
  phone: string;
  clientName?: string;
  balance?: number;
}

interface QRValidateRequest {
  qrToken: string;
}

interface QRUseRequest {
  qrToken: string;
  storeId: string;
  cashierId?: string;
  transactionAmount?: number;
}

/**
 * POST /api/qr/generate
 * Генерація нового QR коду для клієнта
 * Body: { phone: string, clientName?: string, balance?: number }
 */
router.post('/generate', async (req: Request, res: Response) => {
  console.log('📞 POST /api/qr/generate - received');
  console.log('   Body:', JSON.stringify(req.body, null, 2));
  
  try {
    const { phone, clientName, balance } = req.body as QRGenerateRequest;

    if (!phone) {
      console.error('❌ Missing phone parameter');
      return res.status(400).json({
        success: false,
        error: 'Phone number is required',
      });
    }

    // Очищення номера телефону
    const cleanPhone = phone.replace(/\D/g, '');

    // Генерація унікального токену для QR коду
    const qrToken = crypto.randomBytes(32).toString('hex');
    const validUntil = new Date(Date.now() + 5 * 60 * 1000); // 5 хвилин

    try {
      const pool = await getConnection();
      
      // Спроба виклику stored procedure
      const result = await pool
        .request()
        .input('QRToken', sql.NVarChar(100), qrToken)
        .input('PhoneNum', sql.NVarChar(20), cleanPhone)
        .input('ClientName', sql.NVarChar(200), clientName || '')
        .input('Balance', sql.Int, balance || 0)
        .input('ValidUntil', sql.DateTime, validUntil)
        .input('IsUsed', sql.Bit, 0)
        .execute('AZIT.dbo.zeus_CreateQR');

      console.log('✅ QR created in database via stored procedure');
    } catch (dbError: any) {
      // Якщо stored procedure не існує - працюємо без бази даних
      console.warn('⚠️ Stored procedure not found, working without database:', dbError.message);
      console.log('📝 QR Token generated locally:', qrToken);
    }

    // Повертаємо токен та дані (навіть якщо БД недоступна)
    return res.json({
      success: true,
      data: {
        qrToken,
        phone: cleanPhone,
        clientName: clientName || '',
        balance: balance || 0,
        validUntil: validUntil.toISOString(),
        timestamp: Date.now(),
      },
    });
  } catch (error: any) {
    console.error('❌ Error generating QR:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate QR code',
    });
  }
});

/**
 * GET /api/qr/validate/:qrToken
 * Перевірка валідності QR коду
 */
router.get('/validate/:qrToken', async (req: Request, res: Response) => {
  try {
    const { qrToken } = req.params;

    if (!qrToken) {
      return res.status(400).json({
        success: false,
        error: 'QR token is required',
      });
    }

    const pool = await getConnection();
    
    // Виклик stored procedure для перевірки QR коду
    const result = await pool
      .request()
      .input('QRToken', sql.NVarChar(100), qrToken)
      .execute('AZIT.dbo.zeus_ValidateQR');

    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'QR code not found',
      });
    }

    const qrData = result.recordset[0];

    // Перевірка чи не використаний і не застарів
    const isValid = !qrData.IsUsed && new Date(qrData.ValidUntil) > new Date();

    return res.json({
      success: true,
      data: {
        isValid,
        phone: qrData.PhoneNum,
        clientName: qrData.ClientName,
        balance: qrData.Balance,
        validUntil: qrData.ValidUntil,
        isUsed: qrData.IsUsed,
        usedAt: qrData.UsedAt,
      },
    });
  } catch (error: any) {
    console.error('❌ Error validating QR:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to validate QR code',
    });
  }
});

/**
 * POST /api/qr/use
 * Використання QR коду в магазині (касі)
 * Body: { qrToken: string, storeId: string, cashierId?: string, transactionAmount?: number }
 */
router.post('/use', async (req: Request, res: Response) => {
  try {
    const { qrToken, storeId, cashierId, transactionAmount } = req.body as QRUseRequest;

    if (!qrToken || !storeId) {
      return res.status(400).json({
        success: false,
        error: 'QR token and store ID are required',
      });
    }

    const pool = await getConnection();
    
    // Виклик stored procedure для використання QR коду
    const result = await pool
      .request()
      .input('QRToken', sql.NVarChar(100), qrToken)
      .input('StoreId', sql.NVarChar(50), storeId)
      .input('CashierId', sql.NVarChar(50), cashierId || '')
      .input('TransactionAmount', sql.Decimal(18, 2), transactionAmount || 0)
      .execute('AZIT.dbo.zeus_UseQR');

    if (result.recordset.length === 0 || !result.recordset[0].Success) {
      return res.status(400).json({
        success: false,
        error: result.recordset[0]?.ErrorMessage || 'Failed to use QR code',
      });
    }

    return res.json({
      success: true,
      data: {
        message: 'QR code used successfully',
        phone: result.recordset[0].PhoneNum,
        clientName: result.recordset[0].ClientName,
        usedAt: result.recordset[0].UsedAt,
      },
    });
  } catch (error: any) {
    console.error('❌ Error using QR:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to use QR code',
    });
  }
});

/**
 * GET /api/qr/history/:phone
 * Отримання історії QR кодів клієнта
 */
router.get('/history/:phone', async (req: Request, res: Response) => {
  try {
    const { phone } = req.params;
    const cleanPhone = phone.replace(/\D/g, '');

    const pool = await getConnection();
    
    const result = await pool
      .request()
      .input('PhoneNum', sql.NVarChar(20), cleanPhone)
      .execute('AZIT.dbo.zeus_GetQRHistory');

    return res.json({
      success: true,
      data: result.recordset,
    });
  } catch (error: any) {
    console.error('❌ Error getting QR history:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to get QR history',
    });
  }
});

export default router;
