import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';

/**
 * Схеми валідації
 */
export const schemas = {
  // Аутентифікація
  login: z.object({
    phone: z.string().regex(/^\+380\d{9}$/, 'Invalid phone format (+380XXXXXXXXX)'),
  }),

  // QR код
  generateQr: z.object({
    phone: z.string().regex(/^\+380\d{9}$/),
    clientName: z.string().min(1).max(100),
    balance: z.number().min(0),
  }),

  useQr: z.object({
    qrToken: z.string().min(10),
    amount: z.number().positive(),
    storeId: z.string().optional(),
  }),

  // Клієнт
  updateClient: z.object({
    name: z.string().min(1).max(100).optional(),
    email: z.string().email().optional(),
    city: z.string().max(50).optional(),
  }),

  // Акції
  createPromotion: z.object({
    title: z.string().min(1).max(100),
    description: z.string().min(1).max(500),
    discountPercent: z.number().min(0).max(100).optional(),
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
    isActive: z.boolean().optional(),
  }),

  // Промо-код
  applyPromoCode: z.object({
    code: z.string().min(3).max(20).toUpperCase(),
    phone: z.string().regex(/^\+380\d{9}$/),
  }),

  // Пагінація
  pagination: z.object({
    page: z.number().int().positive().optional().default(1),
    limit: z.number().int().positive().max(100).optional().default(20),
  }),
};

/**
 * Middleware фабрика для валідації
 */
export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Валідувати body, query або params в залежності від типу запиту
      const data = {
        ...req.body,
        ...req.query,
        ...req.params,
      };

      console.log('🔍 Validation - incoming data:', JSON.stringify(data, null, 2));
      console.log('🔍 Raw body:', JSON.stringify(req.body, null, 2));
      console.log('🔍 Phone value:', data.phone);
      console.log('🔍 Phone type:', typeof data.phone);

      // Конвертувати числові параметри з query string (але не phone!)
      Object.keys(data).forEach(key => {
        if (key !== 'phone' && data[key] && typeof data[key] === 'string' && !isNaN(Number(data[key]))) {
          console.log(`🔄 Converting ${key} from string to number`);
          data[key] = Number(data[key]);
        }
      });

      console.log('🔍 Data before validation:', JSON.stringify(data, null, 2));
      const validated = schema.parse(data);
      
      console.log('✅ Validation passed:', JSON.stringify(validated, null, 2));
      
      // Оновити req об'єкт валідованими даними
      req.body = { ...req.body, ...validated };
      
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.log('❌ Validation failed:', JSON.stringify(error.errors, null, 2));
        return res.status(400).json({
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
      }
      
      next(error);
    }
  };
};

/**
 * Валідація телефону
 */
export const validatePhone = (phone: string): boolean => {
  return /^\+380\d{9}$/.test(phone);
};

/**
 * Валідація email
 */
export const validateEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

/**
 * Санітизація телефону (видалення +38 або 38)
 */
export const sanitizePhone = (phone: string): string => {
  return phone.replace(/^(\+38|38)/, '');
};
