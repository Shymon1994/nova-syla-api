import { Router, Request, Response } from 'express';
import { getConnection } from '../config/database';

const router = Router();

// GET /api/client/:phone - Отримати дані клієнта
router.get('/:phone', async (req: Request, res: Response) => {
  try {
    const { phone } = req.params;
    const pool = await getConnection();
    
    const result = await pool
      .request()
      .input('PhoneNum', phone)
      .execute('AZIT.dbo.zeus_GetCli');

    if (result.recordset && result.recordset.length > 0) {
      const rawData = result.recordset[0];
      
      // Витягуємо ім'я з поля F7, видаляючи текст в дужках
      let clientName = rawData.NAME || phone;
      if (rawData.F7) {
        // Видаляємо текст в дужках, наприклад "(Менеджер)"
        clientName = rawData.F7.replace(/\s*\([^)]*\)\s*/g, '').trim();
      }
      
      // Формуємо відповідь
      const clientData = {
        clientId: rawData.RECID,
        phone: phone,
        name: clientName,
        balance: 0, // TODO: отримати з бази
        level: 'Бронза', // TODO: розрахувати рівень
      };
      
      res.json({
        success: true,
        data: clientData,
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Клієнта не знайдено',
      });
    }
  } catch (error: any) {
    console.error('❌ Get client error:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка сервера',
      error: error.message,
    });
  }
});

// Інші endpoints можна додати тут:
// GET /api/client/:phone/history - історія покупок
// GET /api/client/:phone/balance - баланс
// POST /api/client/:phone/qr - генерація QR

export default router;
