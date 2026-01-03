import express, { Router, Request, Response } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';
import { validate, schemas } from '../middleware/validation.middleware';
import { adminLimiter } from '../middleware/rateLimiter.middleware';
import { sendSuccess, sendError, sendPaginated, asyncHandler } from '../utils/response.util';
import { query } from '../config/database';

const router: Router = express.Router();

// Всі маршрути вимагають адмін права
router.use(authenticate);
router.use(requireAdmin);
router.use(adminLimiter);

/**
 * GET /api/v2/admin/stats
 * Отримати статистику додатка
 */
router.get('/stats', asyncHandler(async (req: Request, res: Response) => {
  try {
    // Отримуємо реальну статистику з БД через admin.ts v1 endpoint
    // Це тимчасове рішення - краще використовувати v1 який вже реалізований
    return sendError(res, 'USE_V1', 'Use /api/admin/stats instead', 301);
  } catch (error: any) {
    return sendError(res, 'STATS_FAILED', 'Failed to fetch statistics', 500, error);
  }
}));

/**
 * GET /api/v2/admin/users
 * Отримати список користувачів
 */
router.get('/users', asyncHandler(async (req: Request, res: Response) => {
  try {
    // Використовуйте /api/admin/users замість цього endpoint
    return sendError(res, 'USE_V1', 'Use /api/admin/users instead', 301);
  } catch (error: any) {
    return sendError(res, 'USERS_FETCH_FAILED', 'Failed to fetch users', 500, error);
  }
}));

/**
 * GET /api/v2/admin/promotions
 * Отримати список акцій
 */
router.get('/promotions', asyncHandler(async (req: Request, res: Response) => {
  try {
    // Використовуйте /api/admin/promotions замість цього endpoint
    return sendError(res, 'USE_V1', 'Use /api/admin/promotions instead', 301);
  } catch (error: any) {
    return sendError(res, 'PROMOTIONS_FETCH_FAILED', 'Failed to fetch promotions', 500, error);
  }
}));

/**
 * POST /api/v2/admin/promotions
 * Створити нову акцію
 */
router.post(
  '/promotions',
  validate(schemas.createPromotion),
  asyncHandler(async (req: Request, res: Response) => {
    const promotionData = req.body;
    
    try {
      // TODO: Реалізувати створення акції в БД
      
      const newPromotion = {
        id: `promo-${Date.now()}`,
        ...promotionData,
        createdAt: new Date().toISOString(),
      };

      return sendSuccess(res, newPromotion, 'Promotion created', 201);
    } catch (error: any) {
      return sendError(res, 'PROMOTION_CREATE_FAILED', 'Failed to create promotion', 500, error);
    }
  })
);

/**
 * PUT /api/v2/admin/promotions/:id
 * Оновити акцію
 */
router.put('/promotions/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updateData = req.body;
  
  try {
    // TODO: Реалізувати оновлення акції в БД
    
    return sendSuccess(res, { id, ...updateData }, 'Promotion updated');
  } catch (error: any) {
    return sendError(res, 'PROMOTION_UPDATE_FAILED', 'Failed to update promotion', 500, error);
  }
}));

/**
 * DELETE /api/v2/admin/promotions/:id
 * Видалити акцію
 */
router.delete('/promotions/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  try {
    // TODO: Реалізувати видалення акції з БД
    
    return sendSuccess(res, null, 'Promotion deleted');
  } catch (error: any) {
    return sendError(res, 'PROMOTION_DELETE_FAILED', 'Failed to delete promotion', 500, error);
  }
}));

/**
 * GET /api/v2/admin/transactions
 * Отримати всі транзакції
 */
router.get('/transactions', asyncHandler(async (req: Request, res: Response) => {
  try {
    // Використовуйте /api/admin/transactions замість цього endpoint
    return sendError(res, 'USE_V1', 'Use /api/admin/transactions instead', 301);
  } catch (error: any) {
    return sendError(res, 'TRANSACTIONS_FETCH_FAILED', 'Failed to fetch transactions', 500, error);
  }
}));

/**
 * POST /api/v2/admin/promo-codes
 * Створити промо-код
 */
router.post('/promo-codes', asyncHandler(async (req: Request, res: Response) => {
  const { code, discountPercent, bonusPoints, expiresAt } = req.body;
  
  try {
    // TODO: Реалізувати створення промо-коду в БД
    
    const promoCode = {
      code,
      discountPercent,
      bonusPoints,
      expiresAt,
      createdAt: new Date().toISOString(),
      isActive: true,
    };

    return sendSuccess(res, promoCode, 'Promo code created', 201);
  } catch (error: any) {
    return sendError(res, 'PROMO_CODE_CREATE_FAILED', 'Failed to create promo code', 500, error);
  }
}));

/**
 * GET /api/v2/admin/logs
 * Отримати логи API
 */
router.get('/logs', asyncHandler(async (req, res) => {
  const { page = 1, limit = 100 } = req.query;
  
  try {
    // TODO: Реалізувати читання логів з файлу
    
    return sendSuccess(res, [], 'Logs fetched');
  } catch (error: any) {
    return sendError(res, 'LOGS_FETCH_FAILED', 'Failed to fetch logs', 500, error);
  }
}));

export default router;
