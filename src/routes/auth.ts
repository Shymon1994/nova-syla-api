import { Router, Request, Response } from 'express';
import { getConnection } from '../config/database';
import { LoginRequest, LoginResponse, ClientData } from '../types';

const router = Router();

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
    const pool = await getConnection();
    
    // Виклик процедури zeus_GetCli
    // Процедура повертає поля: RECID, NAME, F7
    const result = await pool
      .request()
      .query(`EXEC AZIT.dbo.zeus_GetCli '${cleanPhone}'`);

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
