import { Router, Request, Response } from 'express';
import { getConnection } from '../config/database';
import { LoginRequest, LoginResponse, ClientData } from '../types';
import binotelService from '../services/binotel.service';
import otpService from '../services/otp.service';
import { generateToken } from '../middleware/auth.middleware';

const router = Router();

/**
 * POST /api/auth/request-code
 * Відправка Flash Call з кодом верифікації через Binotel Call Password
 */
router.post('/request-code', async (req: Request, res: Response) => {
  const { phone } = req.body;
  console.log(`📞 Call Password request for ${phone}`);

  try {
    // Валідація
    if (!phone || typeof phone !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Номер телефону обов\'язковий',
      });
    }

    // Перевірка чи не було недавно відправлено код
    if (otpService.hasActiveCode(phone)) {
      const timeLeft = otpService.getTimeLeft(phone);
      return res.status(429).json({
        success: false,
        error: 'CODE_ALREADY_SENT',
        message: `Код вже відправлено. Спробуйте через ${timeLeft} секунд`,
      });
    }

    // Перевірка існування користувача в БД
    const connection = await getConnection();
    let result;
    if (connection.request) {
      result = await connection.request().query(`EXEC AZIT.dbo.zeus_GetCli '${phone}'`);
    } else {
      result = await connection.query(`EXEC AZIT.dbo.zeus_GetCli '${phone}'`);
    }

    if (!result || !result.recordset || result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'USER_NOT_FOUND',
        message: 'Користувача з таким номером не знайдено. Зареєструйтеся спочатку.',
      });
    }

    // Підготовка номера для Binotel API (без + і в форматі E164)
    const phoneE164 = phone.replace(/[^0-9]/g, '');

    // Відправка Call Password через Binotel
    const callPasswordResult = await binotelService.sendCallVerification(
      phoneE164,
      'NovaLoyalty',
      120,
      4
    );

    if (callPasswordResult.success) {
      console.log(`✅ Call Password sent to ${phone}`);
      
      // Зберігаємо мітку що код відправлено
      otpService.saveCode(phone, 'BINOTEL_CODE');
      
      return res.json({
        success: true,
        data: {
          phone,
          expiresIn: 600,
        },
        message: 'Очікуйте дзвінок. Введіть останні 4 цифри номера.',
      });
    } else {
      console.error(`❌ Call Password failed:`, callPasswordResult.message);
      return res.status(500).json({
        success: false,
        error: 'FLASH_CALL_FAILED',
        message: callPasswordResult.message || 'Не вдалося відправити дзвінок',
      });
    }
  } catch (error: any) {
    console.error('❌ Request code error:', error);
    return res.status(500).json({
      success: false,
      error: 'REQUEST_CODE_FAILED',
      message: 'Failed to send code',
    });
  }
});

/**
 * POST /api/auth/verify-code
 * Перевірка коду через Binotel Call Password API та видача JWT токена
 */
router.post('/verify-code', async (req: Request, res: Response) => {
  const { phone, code } = req.body;

  if (!phone || !code) {
    return res.status(400).json({
      success: false,
      error: 'VALIDATION_ERROR',
      message: 'Phone and code are required',
    });
  }

  console.log(`🔐 Verifying Call Password code for ${phone}: ${code}`);

  try {
    // Підготовка номера для Binotel API
    const phoneE164 = phone.replace(/[^0-9]/g, '');

    // Перевірка коду через Binotel Call Password API
    const verification = await binotelService.checkVerificationCode(
      phoneE164,
      code,
      'NovaLoyalty'
    );

    if (!verification.success) {
      let message = 'Невірний код';
      
      if (verification.message?.includes('Bad verification code')) {
        message = 'Невірний код. Спробуйте ще раз.';
      }

      console.log(`❌ Invalid code for ${phone}: ${verification.message}`);
      return res.status(400).json({
        success: false,
        error: 'INVALID_CODE',
        message,
      });
    }

    // Код правильний - отримуємо дані користувача з БД
    const connection = await getConnection();
    let result;
    if (connection.request) {
      result = await connection.request().query(`EXEC AZIT.dbo.zeus_GetCli '${phone}'`);
    } else {
      result = await connection.query(`EXEC AZIT.dbo.zeus_GetCli '${phone}'`);
    }

    if (result && result.recordset && result.recordset.length > 0) {
      const client = result.recordset[0];
      
      // Отримуємо ім'я клієнта
      let clientName = client.F7 || client.NAME || phone;
      if (clientName && typeof clientName === 'string') {
        clientName = clientName
          .replace(/\s*\([^)]*\)\s*/g, '')
          .replace(/\s+\d{4,}$/g, '')
          .trim();
      }
      
      const clientData = {
        clientId: client.RECID,
        name: clientName,
        balance: 0,
        level: 'Бронза',
      };
      
      // Генерація JWT токена
      const token = generateToken(phone, clientData.clientId);

      // Очищаємо використаний код
      otpService.clearCode(phone);

      console.log(`✅ User ${phone} authenticated successfully via Call Password`);

      return res.json({
        success: true,
        data: {
          token,
          user: {
            phone,
            clientId: clientData.clientId,
            name: clientData.name,
            balance: clientData.balance,
            level: clientData.level,
          },
        },
        message: 'Авторизація успішна',
      });
    } else {
      return res.status(404).json({
        success: false,
        error: 'USER_NOT_FOUND',
        message: 'Користувача не знайдено',
      });
    }
  } catch (error: any) {
    console.error('❌ Verify code error:', error);
    return res.status(500).json({
      success: false,
      error: 'VERIFY_CODE_FAILED',
      message: 'Failed to verify code',
    });
  }
});

// POST /api/auth/login
router.post('/login', async (req: Request<{}, {}, LoginRequest>, res: Response<LoginResponse>) => {
  console.log('📞 POST /api/auth/login - received');
  console.log('   Body:', JSON.stringify(req.body, null, 2));
  
  try {
    const { phone } = req.body;

    // Валідація
    if (!phone || typeof phone !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Номер телефону обов\'язковий',
      });
    }

    // Перевірка формату
    const cleanPhone = phone.trim();
    if (!cleanPhone.startsWith('+380') || cleanPhone.length !== 13) {
      return res.status(400).json({
        success: false,
        message: 'Невірний формат номера телефону',
      });
    }

    // Підключення до БД
    const connection = await getConnection();
    
    // Виклик процедури zeus_GetCli
    // Процедура повертає поля: RECID, NAME, F7
    let result;
    if (connection.request) {
      // Direct MSSQL connection
      result = await connection.request().query(`EXEC AZIT.dbo.zeus_GetCli '${cleanPhone}'`);
    } else {
      // SQL Proxy connection
      result = await connection.query(`EXEC AZIT.dbo.zeus_GetCli '${cleanPhone}'`);
    }

    // Обробка результату
    if (result.recordset && result.recordset.length > 0) {
      console.log(`✅ zeus_GetCli returned ${result.recordset.length} records for ${cleanPhone}`);
      
      // Фільтруємо записи: беремо тільки з валідним RECID та F7
      const validRecords = result.recordset.filter((r: any) => r.RECID && r.F7);
      
      if (validRecords.length === 0) {
        console.log('❌ No valid records found (missing RECID or F7)');
        res.status(404).json({
          success: false,
          message: 'Клієнта з таким номером не знайдено',
        });
        return;
      }
      
      // Вибираємо найкращий запис
      // Пріоритет: записи де F7 не містить дужок або коротші назви
      const bestRecord = validRecords.reduce((best: any, current: any) => {
        const bestF7 = best.F7 || '';
        const currentF7 = current.F7 || '';
        
        // Якщо поточний запис не має дужок, а найкращий має - беремо поточний
        if (!currentF7.includes('(') && bestF7.includes('(')) {
          return current;
        }
        
        // Якщо найкращий не має дужок, а поточний має - залишаємо найкращий
        if (bestF7.includes('(') && !currentF7.includes('(')) {
          return best;
        }
        
        // Якщо обидва мають дужки або обидва без - беремо коротший
        if (currentF7.length < bestF7.length) {
          return current;
        }
        
        return best;
      });
      
      const record = bestRecord;
      console.log(`✅ Selected record: RECID=${record.RECID}, NAME=${record.NAME}, F7=${record.F7}`);
      
      // Отримуємо ім'я клієнта з поля F7 (повна назва/ім'я)
      let clientName = record.F7 || record.NAME || cleanPhone;
      
      // Видаляємо коди типу "0744" та дужки з імені
      if (clientName && typeof clientName === 'string') {
        // Видаляємо текст у дужках та цифри в кінці
        clientName = clientName
          .replace(/\s*\([^)]*\)\s*/g, '') // видаляємо (текст)
          .replace(/\s+\d{4,}$/g, '') // видаляємо коди типу " 0744"
          .trim();
      }
      
      const clientData: ClientData = {
        clientId: record.RECID, // Використовуємо RECID як ID клієнта
        phone: cleanPhone,
        name: clientName,
        balance: 0, // zeus_GetCli не повертає баланс
        level: 'Бронза', // За замовчуванням
        email: undefined,
        city: undefined,
        registeredAt: undefined,
      };

      res.json({
        success: true,
        message: 'Клієнта знайдено',
        data: clientData,
      });
    } else {
      // Клієнта не знайдено - можна автоматично створити або повернути помилку
      res.status(404).json({
        success: false,
        message: 'Клієнта з таким номером не знайдено',
      });
    }
  } catch (error: any) {
    console.error('❌ Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка сервера',
    });
  }
});

// GET /api/auth/check/:phone - Перевірка існування клієнта
router.get('/check/:phone', async (req: Request, res: Response) => {
  try {
    const { phone } = req.params;
    const pool = await getConnection();
    
    // Використовуємо той самий спосіб виклику процедури
    const result = await pool
      .request()
      .query(`EXEC AZIT.dbo.zeus_GetCli '${phone}'`);

    const exists = result.recordset && result.recordset.length > 0;
    
    res.json({
      success: true,
      exists,
      count: result.recordset ? result.recordset.length : 0,
    });
  } catch (error: any) {
    console.error('❌ Check error:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка сервера',
      error: error.message,
    });
  }
});

export default router;
