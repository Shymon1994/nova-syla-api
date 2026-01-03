import express, { Router, Request, Response } from 'express';
import { authenticate, requireAdmin, generateToken } from '../middleware/auth.middleware';
import { validate, schemas } from '../middleware/validation.middleware';
import { sendSuccess, sendError, asyncHandler } from '../utils/response.util';
import { query } from '../config/database';
import binotelService from '../services/binotel.service';
import otpService from '../services/otp.service';

const router: Router = express.Router();

/**
 * POST /api/v2/auth/request-code
 * Відправка Flash Call з кодом верифікації через Binotel Call Password
 * Підтримує логіку повторних спроб: 60, 120, 300 секунд
 */
router.post(
  '/request-code',
  validate(schemas.login), // Використовуємо ту ж схему валідації phone
  asyncHandler(async (req: Request, res: Response) => {
    const { phone } = req.body;
    console.log(`📞 Call Password request for ${phone}`);

    try {
      // Перевірка чи не було недавно відправлено код
      if (otpService.hasActiveCode(phone)) {
        const timeLeft = otpService.getTimeLeft(phone);
        return sendError(
          res,
          'CODE_ALREADY_SENT',
          `Код вже відправлено. Спробуйте через ${timeLeft} секунд`,
          429
        );
      }

      // Перевірка існування користувача в БД
      const result = await query('EXEC AZIT.dbo.zeus_GetCli @PhoneNum = @phone', {
        phone: phone,
      });

      if (!result || !result.recordset || result.recordset.length === 0) {
        return sendError(
          res,
          'USER_NOT_FOUND',
          'Користувача з таким номером не знайдено. Зареєструйтеся спочатку.',
          404
        );
      }

      // Підготовка номера для Binotel API (без + і в форматі E164)
      const phoneE164 = phone.replace(/[^0-9]/g, '');

      // Відправка Call Password через Binotel
      // Binotel сам генерує код і відправляє дзвінок
      const callPasswordResult = await binotelService.sendCallVerification(
        phoneE164,
        'NovaLoyalty', // application name
        120, // lifetime в хвилинах (максимум для надійності)
        4 // code length
      );

      if (callPasswordResult.success) {
        console.log(`✅ Call Password sent to ${phone}`);
        
        // Зберігаємо мітку що код відправлено (для rate limiting)
        otpService.saveCode(phone, 'BINOTEL_CODE');
        
        return sendSuccess(res, {
          phone,
          expiresIn: 600, // 10 хвилин
          message: 'Очікуйте дзвінок. Введіть останні 4 цифри номера.',
        }, 'Дзвінок надсилається');
      } else {
        console.error(`❌ Call Password failed:`, callPasswordResult.message);
        return sendError(
          res,
          'FLASH_CALL_FAILED',
          callPasswordResult.message || 'Не вдалося відправити дзвінок',
          500
        );
      }
    } catch (error: any) {
      console.error('❌ Request code error:', error);
      return sendError(res, 'REQUEST_CODE_FAILED', 'Failed to send code', 500, error);
    }
  })
);

/**
 * POST /api/v2/auth/verify-code
 * Перевірка коду через Binotel Call Password API та видача JWT токена
 */
router.post(
  '/verify-code',
  asyncHandler(async (req: Request, res: Response) => {
    const { phone, code } = req.body;

    if (!phone || !code) {
      return sendError(res, 'VALIDATION_ERROR', 'Phone and code are required', 400);
    }

    console.log(`🔐 Verifying Call Password code for ${phone}: ${code}`);

    try {
      // Підготовка номера для Binotel API (без + і в форматі E164)
      const phoneE164 = phone.replace(/[^0-9]/g, '');

      // Перевірка коду через Binotel Call Password API
      const verification = await binotelService.checkVerificationCode(
        phoneE164,
        code,
        'NovaLoyalty' // application name (має співпадати з request-code)
      );

      if (!verification.success) {
        let message = 'Невірний код';
        
        if (verification.message?.includes('Bad verification code')) {
          message = 'Невірний код. Спробуйте ще раз.';
        }

        console.log(`❌ Invalid code for ${phone}: ${verification.message}`);
        return sendError(res, 'INVALID_CODE', message, 400);
      }

      // Код правильний - отримуємо дані користувача з БД
      const result = await query('EXEC AZIT.dbo.zeus_GetCli @PhoneNum = @phone', {
        phone: phone,
      });

      if (result && result.recordset && result.recordset.length > 0) {
        const client = result.recordset[0];
        
        const clientData = {
          clientId: client.RECID || client.ClientID,
          name: client.F7 || client.ClientName || 'Клієнт Нова Сила',
          balance: client.Balance || 0,
          level: client.Level || 'Бронза',
        };
        
        // Генерація JWT токена
        const token = generateToken(phone, clientData.clientId);

        // Очищаємо використаний код з rate limiting
        otpService.clearCode(phone);

        console.log(`✅ User ${phone} authenticated successfully via Call Password`);

        return sendSuccess(res, {
          token,
          user: {
            phone,
            clientId: clientData.clientId,
            name: clientData.name,
            balance: clientData.balance,
            level: clientData.level,
          },
        }, 'Авторизація успішна');
      } else {
        return sendError(res, 'USER_NOT_FOUND', 'Користувача не знайдено', 404);
      }
    } catch (error: any) {
      console.error('❌ Verify code error:', error);
      return sendError(res, 'VERIFY_CODE_FAILED', 'Failed to verify code', 500, error);
    }
  })
);

/**
 * POST /api/v2/auth/login
 * ЗАСТАРІЛИЙ МЕТОД - використовуйте request-code + verify-code
 * Залишено для зворотної сумісності
 */
router.post(
  '/login',
  validate(schemas.login),
  asyncHandler(async (req: Request, res: Response) => {
    console.log('📥 Login request body:', JSON.stringify(req.body, null, 2));
    const { phone } = req.body;

    try {
      // Перевірка існування користувача в БД
      // В БД номери зберігаються в форматі +380XXXXXXXXX
      console.log('🔍 Querying DB for phone:', phone);
      
      const result = await query('EXEC AZIT.dbo.zeus_GetCli @PhoneNum = @phone', {
        phone: phone, // Передаємо як є: +380960608968
      });

      console.log('📊 DB Result:', result ? JSON.stringify(result.recordset, null, 2) : 'No results');

      if (result && result.recordset && result.recordset.length > 0) {
        const client = result.recordset[0];
        console.log('✅ Raw client data:', client);
        
        // Маппінг полів з SQL Server
        const clientData = {
          clientId: client.RECID || client.ClientID,
          name: client.F7 || client.ClientName || 'Клієнт Нова Сила',
          balance: client.Balance || 0,
          level: client.Level || 'Бронза',
        };
        
        console.log('✅ Mapped client data:', clientData);
        
        // Генерація JWT токена
        const token = generateToken(phone, clientData.clientId);

        return sendSuccess(res, {
          token,
          user: {
            phone,
            clientId: clientData.clientId,
            name: clientData.name,
            balance: clientData.balance,
            level: clientData.level,
          },
        }, 'Login successful');
      } else {
        console.log('⚠️ Client not found in DB - creating new user');
        // Користувач не знайдений, створюємо нового (опціонально)
        const token = generateToken(phone);
        
        return sendSuccess(res, {
          token,
          user: {
            phone,
            name: 'Клієнт Нова Сила',
            balance: 0,
            level: 'Бронза',
          },
          isNew: true,
        }, 'New user created');
      }
    } catch (error: any) {
      console.error('❌ Login error:', error);
      return sendError(res, 'LOGIN_FAILED', 'Failed to authenticate', 500, error);
    }
  })
);

/**
 * GET /api/v2/auth/verify
 * Перевірка валідності JWT токена
 */
router.get('/verify', authenticate, (req: any, res) => {
  return sendSuccess(res, {
    valid: true,
    user: req.user,
  });
});

/**
 * POST /api/v2/auth/refresh
 * Оновлення JWT токена
 */
router.post('/refresh', authenticate, (req: any, res) => {
  const newToken = generateToken(req.user.phone, req.user.clientId);
  
  return sendSuccess(res, {
    token: newToken,
  }, 'Token refreshed');
});

/**
 * POST /api/v2/auth/logout
 * Logout (на клієнті просто видалити токен)
 */
router.post('/logout', authenticate, (req, res) => {
  // В реальності тут можна додати токен в blacklist
  return sendSuccess(res, null, 'Logged out successfully');
});

export default router;
