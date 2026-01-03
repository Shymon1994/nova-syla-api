import { Request, Response } from 'express';

/**
 * Стандартний формат успішної відповіді
 */
export interface SuccessResponse<T = any> {
  success: true;
  data: T;
  message?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

/**
 * Стандартний формат помилки
 */
export interface ErrorResponse {
  success: false;
  error: string;
  message: string;
  details?: any;
  stack?: string;
}

/**
 * Відправка успішної відповіді
 */
export const sendSuccess = <T = any>(
  res: Response,
  data: T,
  message?: string,
  statusCode: number = 200,
  meta?: SuccessResponse['meta']
): Response => {
  const response: SuccessResponse<T> = {
    success: true,
    data,
  };

  if (message) response.message = message;
  if (meta) response.meta = meta;

  return res.status(statusCode).json(response);
};

/**
 * Відправка помилки
 */
export const sendError = (
  res: Response,
  error: string,
  message: string,
  statusCode: number = 500,
  details?: any
): Response => {
  const response: ErrorResponse = {
    success: false,
    error,
    message,
  };

  if (details) response.details = details;
  
  // Додавати stack trace тільки в development
  if (process.env.NODE_ENV === 'development' && details?.stack) {
    response.stack = details.stack;
  }

  return res.status(statusCode).json(response);
};

/**
 * Обробник помилок для асинхронних функцій
 */
export const asyncHandler = (fn: (req: Request, res: Response, next: any) => Promise<any>) => {
  return (req: Request, res: Response, next: any) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Відправка помилки 400 - Bad Request
 */
export const sendBadRequest = (res: Response, message: string, details?: any): Response => {
  return sendError(res, 'BAD_REQUEST', message, 400, details);
};

/**
 * Відправка помилки 401 - Unauthorized
 */
export const sendUnauthorized = (res: Response, message: string = 'Unauthorized'): Response => {
  return sendError(res, 'UNAUTHORIZED', message, 401);
};

/**
 * Відправка помилки 403 - Forbidden
 */
export const sendForbidden = (res: Response, message: string = 'Forbidden'): Response => {
  return sendError(res, 'FORBIDDEN', message, 403);
};

/**
 * Відправка помилки 404 - Not Found
 */
export const sendNotFound = (res: Response, message: string = 'Resource not found'): Response => {
  return sendError(res, 'NOT_FOUND', message, 404);
};

/**
 * Відправка помилки 409 - Conflict
 */
export const sendConflict = (res: Response, message: string, details?: any): Response => {
  return sendError(res, 'CONFLICT', message, 409, details);
};

/**
 * Відправка помилки 500 - Internal Server Error
 */
export const sendInternalError = (res: Response, error?: any): Response => {
  console.error('Internal Server Error:', error);
  return sendError(
    res,
    'INTERNAL_SERVER_ERROR',
    'An unexpected error occurred',
    500,
    process.env.NODE_ENV === 'development' ? error : undefined
  );
};

/**
 * Валідація і відправка відповіді з пагінацією
 */
export const sendPaginated = <T = any>(
  res: Response,
  data: T[],
  page: number,
  limit: number,
  total: number,
  message?: string
): Response => {
  const totalPages = Math.ceil(total / limit);

  return sendSuccess(
    res,
    data,
    message,
    200,
    {
      page,
      limit,
      total,
      totalPages,
    }
  );
};
