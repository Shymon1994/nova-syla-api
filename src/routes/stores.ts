/**
 * Stores Routes - API endpoints для управління магазинами
 */
import { Router, Request, Response } from 'express';
import { getConnection } from '../config/database';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

// Всі маршрути /admin/stores вимагають аутентифікації та адмін прав
router.use('/stores', authenticate);
router.use('/stores', requireAdmin);

// GET /api/admin/stores - Отримати список магазинів
router.get('/stores', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = (page - 1) * limit;
    const search = req.query.search as string || '';
    
    const pool = await getConnection();
    
    let whereClause = '';
    if (search) {
      whereClause = `WHERE StoreName LIKE '%${search}%' OR City LIKE '%${search}%' OR StoreId LIKE '%${search}%'`;
    }
    
    // Отримуємо магазини
    const result = await pool.request().query(`
      SELECT 
        Id,
        StoreId,
        StoreName,
        StoreType,
        Address,
        City,
        Region,
        Phone,
        WorkingHours,
        Latitude,
        Longitude,
        IsActive,
        CreatedAt,
        UpdatedAt
      FROM AZIT.dbo.Stores
      ${whereClause}
      ORDER BY CreatedAt DESC
      OFFSET ${offset} ROWS
      FETCH NEXT ${limit} ROWS ONLY
    `);
    
    // Отримуємо загальну кількість
    const countResult = await pool.request().query(`
      SELECT COUNT(*) as total
      FROM AZIT.dbo.Stores
      ${whereClause}
    `);
    
    const total = countResult.recordset[0]?.total || 0;
    
    const stores = result.recordset.map((row: any) => ({
      id: row.Id.toString(),
      storeId: row.StoreId,
      name: row.StoreName,
      type: row.StoreType,
      address: row.Address || '',
      city: row.City || '',
      region: row.Region || '',
      phone: row.Phone || '',
      workingHours: row.WorkingHours || '',
      latitude: row.Latitude,
      longitude: row.Longitude,
      isActive: row.IsActive,
      createdAt: row.CreatedAt ? new Date(row.CreatedAt).toISOString() : null,
      updatedAt: row.UpdatedAt ? new Date(row.UpdatedAt).toISOString() : null,
    }));
    
    res.json({
      success: true,
      data: {
        stores,
        page,
        limit,
        total,
      },
    });
  } catch (error: any) {
    console.error('❌ Get stores error:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка сервера',
      error: error.message,
    });
  }
});

// POST /api/admin/stores - Створити новий магазин
router.post('/stores', async (req: Request, res: Response) => {
  try {
    const {
      storeId,
      name,
      type,
      address,
      city,
      region,
      phone,
      workingHours,
      latitude,
      longitude,
    } = req.body;
    
    if (!storeId || !name || !type) {
      return res.status(400).json({
        success: false,
        message: 'Не вказано обов\'язкові поля: storeId, name, type',
      });
    }
    
    const pool = await getConnection();
    
    // Перевіряємо чи не існує магазин з таким ID
    const existingStore = await pool.request().query(`
      SELECT StoreId FROM AZIT.dbo.Stores WHERE StoreId = '${storeId}'
    `);
    
    if (existingStore.recordset.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Магазин з таким ID вже існує',
      });
    }
    
    // Створюємо магазин
    await pool.request().query(`
      INSERT INTO AZIT.dbo.Stores (
        StoreId,
        StoreName,
        StoreType,
        Address,
        City,
        Region,
        Phone,
        WorkingHours,
        Latitude,
        Longitude,
        IsActive
      ) VALUES (
        '${storeId}',
        '${name.replace(/'/g, "''")}',
        '${type}',
        ${address ? `'${address.replace(/'/g, "''")}'` : 'NULL'},
        ${city ? `'${city.replace(/'/g, "''")}'` : 'NULL'},
        ${region ? `'${region.replace(/'/g, "''")}'` : 'NULL'},
        ${phone ? `'${phone}'` : 'NULL'},
        ${workingHours ? `'${workingHours.replace(/'/g, "''")}'` : 'NULL'},
        ${latitude || 'NULL'},
        ${longitude || 'NULL'},
        1
      )
    `);
    
    // Отримуємо створений магазин
    const newStore = await pool.request().query(`
      SELECT 
        Id,
        StoreId,
        StoreName,
        StoreType,
        Address,
        City,
        Region,
        Phone,
        WorkingHours,
        Latitude,
        Longitude,
        IsActive,
        CreatedAt
      FROM AZIT.dbo.Stores
      WHERE StoreId = '${storeId}'
    `);
    
    const store = newStore.recordset[0];
    
    res.json({
      success: true,
      message: 'Магазин успішно створено',
      data: {
        id: store.Id.toString(),
        storeId: store.StoreId,
        name: store.StoreName,
        type: store.StoreType,
        address: store.Address || '',
        city: store.City || '',
        region: store.Region || '',
        phone: store.Phone || '',
        workingHours: store.WorkingHours || '',
        latitude: store.Latitude,
        longitude: store.Longitude,
        isActive: store.IsActive,
        createdAt: store.CreatedAt ? new Date(store.CreatedAt).toISOString() : null,
      },
    });
  } catch (error: any) {
    console.error('❌ Create store error:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка сервера',
      error: error.message,
    });
  }
});

// PUT /api/admin/stores/:id - Оновити магазин
router.put('/stores/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      name,
      type,
      address,
      city,
      region,
      phone,
      workingHours,
      latitude,
      longitude,
      isActive,
    } = req.body;
    
    const pool = await getConnection();
    
    // Перевіряємо чи існує магазин
    const existing = await pool.request().query(`
      SELECT Id FROM AZIT.dbo.Stores WHERE Id = ${id}
    `);
    
    if (existing.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Магазин не знайдено',
      });
    }
    
    // Оновлюємо магазин
    const updates: string[] = [];
    if (name !== undefined) updates.push(`StoreName = '${name.replace(/'/g, "''")}'`);
    if (type !== undefined) updates.push(`StoreType = '${type}'`);
    if (address !== undefined) updates.push(`Address = ${address ? `'${address.replace(/'/g, "''")}'` : 'NULL'}`);
    if (city !== undefined) updates.push(`City = ${city ? `'${city.replace(/'/g, "''")}'` : 'NULL'}`);
    if (region !== undefined) updates.push(`Region = ${region ? `'${region.replace(/'/g, "''")}'` : 'NULL'}`);
    if (phone !== undefined) updates.push(`Phone = ${phone ? `'${phone}'` : 'NULL'}`);
    if (workingHours !== undefined) updates.push(`WorkingHours = ${workingHours ? `'${workingHours.replace(/'/g, "''")}'` : 'NULL'}`);
    if (latitude !== undefined) updates.push(`Latitude = ${latitude || 'NULL'}`);
    if (longitude !== undefined) updates.push(`Longitude = ${longitude || 'NULL'}`);
    if (isActive !== undefined) updates.push(`IsActive = ${isActive ? 1 : 0}`);
    updates.push(`UpdatedAt = GETDATE()`);
    
    await pool.request().query(`
      UPDATE AZIT.dbo.Stores
      SET ${updates.join(', ')}
      WHERE Id = ${id}
    `);
    
    // Отримуємо оновлений магазин
    const updated = await pool.request().query(`
      SELECT 
        Id,
        StoreId,
        StoreName,
        StoreType,
        Address,
        City,
        Region,
        Phone,
        WorkingHours,
        Latitude,
        Longitude,
        IsActive,
        CreatedAt,
        UpdatedAt
      FROM AZIT.dbo.Stores
      WHERE Id = ${id}
    `);
    
    const store = updated.recordset[0];
    
    res.json({
      success: true,
      message: 'Магазин успішно оновлено',
      data: {
        id: store.Id.toString(),
        storeId: store.StoreId,
        name: store.StoreName,
        type: store.StoreType,
        address: store.Address || '',
        city: store.City || '',
        region: store.Region || '',
        phone: store.Phone || '',
        workingHours: store.WorkingHours || '',
        latitude: store.Latitude,
        longitude: store.Longitude,
        isActive: store.IsActive,
        createdAt: store.CreatedAt ? new Date(store.CreatedAt).toISOString() : null,
        updatedAt: store.UpdatedAt ? new Date(store.UpdatedAt).toISOString() : null,
      },
    });
  } catch (error: any) {
    console.error('❌ Update store error:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка сервера',
      error: error.message,
    });
  }
});

// DELETE /api/admin/stores/:id - Видалити магазин
router.delete('/stores/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const pool = await getConnection();
    
    // Перевіряємо чи існує магазин
    const existing = await pool.request().query(`
      SELECT Id FROM AZIT.dbo.Stores WHERE Id = ${id}
    `);
    
    if (existing.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Магазин не знайдено',
      });
    }
    
    // Видаляємо магазин
    await pool.request().query(`
      DELETE FROM AZIT.dbo.Stores WHERE Id = ${id}
    `);
    
    res.json({
      success: true,
      message: 'Магазин успішно видалено',
    });
  } catch (error: any) {
    console.error('❌ Delete store error:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка сервера',
      error: error.message,
    });
  }
});

// GET /api/stores/:storeId - Отримати інформацію про магазин (публічний endpoint)
router.get('/:storeId', async (req: Request, res: Response) => {
  try {
    const { storeId } = req.params;
    
    const pool = await getConnection();
    
    const result = await pool.request().query(`
      SELECT 
        StoreId,
        StoreName,
        StoreType,
        Address,
        City,
        Region,
        Phone,
        WorkingHours,
        Latitude,
        Longitude
      FROM AZIT.dbo.Stores
      WHERE StoreId = '${storeId}' AND IsActive = 1
    `);
    
    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Магазин не знайдено',
      });
    }
    
    const store = result.recordset[0];
    
    res.json({
      success: true,
      data: {
        storeId: store.StoreId,
        name: store.StoreName,
        type: store.StoreType,
        address: store.Address || '',
        city: store.City || '',
        region: store.Region || '',
        phone: store.Phone || '',
        workingHours: store.WorkingHours || '',
        latitude: store.Latitude,
        longitude: store.Longitude,
      },
    });
  } catch (error: any) {
    console.error('❌ Get store error:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка сервера',
      error: error.message,
    });
  }
});

export default router;
