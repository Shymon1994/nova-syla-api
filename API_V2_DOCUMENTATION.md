# 🚀 Nova Syla Loyalty API v2.0 - Потужна Архітектура

## 📋 Зміст
- [Огляд](#огляд)
- [Встановлення](#встановлення)
- [Архітектура](#архітектура)
- [Аутентифікація](#аутентифікація)
- [Endpoints](#endpoints)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [Валідація](#валідація)
- [Логування](#логування)

---

## 🎯 Огляд

Nova Syla Loyalty API v2.0 - це професійно розроблений RESTful API з:

### Ключові особливості:
- ✅ **JWT Authentication** - Безпечна аутентифікація з токенами
- ✅ **API Versioning** - Підтримка v1 (legacy) та v2 (new)
- ✅ **Request Validation** - Zod schemas для валідації вхідних даних
- ✅ **Rate Limiting** - Захист від DDoS та зловживань
- ✅ **Centralized Error Handling** - Єдиний формат помилок
- ✅ **Request Logging** - Детальне логування всіх запитів
- ✅ **Role-Based Access** - Розмежування прав (User/Admin)
- ✅ **Response Formatting** - Стандартизований формат відповідей
- ✅ **Async/Await** - Сучасний асинхронний код

---

## 🛠 Встановлення

### 1. Встановити залежності
```bash
cd backend
npm install
```

### 2. Налаштувати .env
```env
PORT=3001
NODE_ENV=development
JWT_SECRET=your-secret-key-here

# Database
DB_SERVER=10.131.10.25
DB_PORT=1433
DB_DATABASE=AZIT
DB_USER=zeus
DB_PASSWORD=your-password
```

### 3. Запустити сервер
```bash
# Development mode
npm run dev

# Production build
npm run build
npm start
```

---

## 🏗 Архітектура

### Структура проекту
```
backend/
├── src/
│   ├── server.ts              # Старий сервер
│   ├── server.v2.ts           # Новий потужний сервер ⭐
│   ├── config/
│   │   └── database.ts
│   ├── middleware/
│   │   ├── auth.middleware.ts         # JWT auth ⭐
│   │   ├── validation.middleware.ts   # Zod validation ⭐
│   │   ├── rateLimiter.middleware.ts  # Rate limiting ⭐
│   │   └── logger.middleware.ts       # Request logging ⭐
│   ├── routes/
│   │   ├── auth.ts            # V1 (legacy)
│   │   ├── auth.v2.ts         # V2 (new) ⭐
│   │   ├── client.v2.ts       # ⭐
│   │   ├── qr.v2.ts           # ⭐
│   │   └── admin.v2.ts        # ⭐
│   ├── utils/
│   │   └── response.util.ts   # Response helpers ⭐
│   └── types/
├── logs/                      # Auto-generated logs ⭐
│   ├── api.log
│   └── error.log
└── package.json
```

### Middleware Flow
```
Request
  ↓
CORS & Helmet (Security)
  ↓
Body Parsing
  ↓
Request ID
  ↓
Request Logger
  ↓
Rate Limiter
  ↓
Authentication (if required)
  ↓
Validation (if required)
  ↓
Route Handler
  ↓
Response Formatter
  ↓
Response
```

---

## 🔐 Аутентифікація

### 1. Отримати JWT токен
```http
POST /api/v2/auth/login
Content-Type: application/json

{
  "phone": "+380960608968"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "phone": "+380960608968",
      "clientId": "6C3D5EAC4021C140",
      "name": "Шимон Василь Васильович",
      "balance": 1250,
      "level": "Золото"
    }
  },
  "message": "Login successful"
}
```

### 2. Використовувати токен в запитах
```http
GET /api/v2/client/me
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3. Оновити токен (якщо закінчився)
```http
POST /api/v2/auth/refresh
Authorization: Bearer <old_token>
```

### JWT Structure
```json
{
  "phone": "+380960608968",
  "clientId": "6C3D5EAC4021C140",
  "isAdmin": true,
  "iat": 1703340000,
  "exp": 1705932000
}
```

---

## 📡 Endpoints

### Auth Endpoints

#### POST /api/v2/auth/login
Логін користувача

**Request:**
```json
{
  "phone": "+380960608968"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "jwt_token_here",
    "user": { ... }
  }
}
```

#### GET /api/v2/auth/verify
Перевірка валідності токена
- **Auth:** Required

#### POST /api/v2/auth/refresh
Оновлення токена
- **Auth:** Required

#### POST /api/v2/auth/logout
Logout користувача
- **Auth:** Required

---

### Client Endpoints

#### GET /api/v2/client/me
Отримати дані поточного користувача
- **Auth:** Required

**Response:**
```json
{
  "success": true,
  "data": {
    "clientId": "...",
    "phone": "+380960608968",
    "name": "Шимон В. В.",
    "balance": 1250,
    "level": "Золото",
    "email": "example@email.com",
    "city": "Київ"
  }
}
```

#### PUT /api/v2/client/me
Оновити профіль
- **Auth:** Required

**Request:**
```json
{
  "name": "Нове Ім'я",
  "email": "new@email.com",
  "city": "Львів"
}
```

#### GET /api/v2/client/me/balance
Отримати баланс
- **Auth:** Required

#### GET /api/v2/client/me/transactions
Отримати історію транзакцій
- **Auth:** Required
- **Query:** `?page=1&limit=20`

---

### QR Endpoints

#### POST /api/v2/qr/generate
Генерація QR коду
- **Auth:** Required
- **Rate Limit:** 10 per 5 minutes

**Request:**
```json
{
  "phone": "+380960608968",
  "clientName": "Шимон В. В.",
  "balance": 1250
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "qrToken": "fe5232e923bf966cc...",
    "phone": "380960608968",
    "clientName": "Шимон В. В.",
    "balance": 1250,
    "validUntil": "2025-12-23T15:11:57.855Z",
    "timestamp": 1766502118099
  }
}
```

#### GET /api/v2/qr/validate/:qrToken
Валідація QR коду

#### POST /api/v2/qr/use
Використання QR коду (оплата)
- **Auth:** Required

**Request:**
```json
{
  "qrToken": "fe5232e923bf966cc...",
  "amount": 450,
  "storeId": "store-123"
}
```

#### GET /api/v2/qr/history
Історія QR кодів
- **Auth:** Required
- **Query:** `?page=1&limit=20`

---

### Admin Endpoints

**Всі адмін endpoints потребують:**
- **Auth:** Required
- **Role:** Admin
- **Rate Limit:** 50 per 15 minutes

#### GET /api/v2/admin/stats
Статистика додатка

**Response:**
```json
{
  "success": true,
  "data": {
    "users": {
      "total": 1247,
      "active": 892,
      "new": 45
    },
    "transactions": {
      "total": 15847,
      "today": 127,
      "totalAmount": 2847965
    },
    "qrCodes": {
      "generated": 8921,
      "used": 7456,
      "active": 1465
    }
  }
}
```

#### GET /api/v2/admin/users
Список користувачів
- **Query:** `?page=1&limit=20&search=term`

#### GET /api/v2/admin/promotions
Список акцій

#### POST /api/v2/admin/promotions
Створити акцію

**Request:**
```json
{
  "title": "Подвійні бали",
  "description": "Отримуйте подвійні бали",
  "discountPercent": 0,
  "startDate": "2025-12-20T00:00:00Z",
  "endDate": "2025-12-31T23:59:59Z",
  "isActive": true
}
```

#### PUT /api/v2/admin/promotions/:id
Оновити акцію

#### DELETE /api/v2/admin/promotions/:id
Видалити акцію

#### GET /api/v2/admin/transactions
Всі транзакції
- **Query:** `?page=1&limit=50&startDate=...&endDate=...`

#### POST /api/v2/admin/promo-codes
Створити промо-код

#### GET /api/v2/admin/logs
Отримати логи API

---

## ❌ Error Handling

### Формат помилки
```json
{
  "success": false,
  "error": "ERROR_CODE",
  "message": "Human readable message",
  "details": { } // Optional, в development mode
}
```

### Error Codes
| Code | Status | Description |
|------|--------|-------------|
| `BAD_REQUEST` | 400 | Невалідні дані |
| `VALIDATION_ERROR` | 400 | Помилка валідації |
| `UNAUTHORIZED` | 401 | Не авторизований |
| `INVALID_TOKEN` | 401 | Невалідний токен |
| `FORBIDDEN` | 403 | Немає прав доступу |
| `NOT_FOUND` | 404 | Ресурс не знайдено |
| `CONFLICT` | 409 | Конфлікт даних |
| `TOO_MANY_REQUESTS` | 429 | Перевищено ліміт запитів |
| `INTERNAL_SERVER_ERROR` | 500 | Внутрішня помилка |

### Приклади помилок

**Validation Error:**
```json
{
  "success": false,
  "error": "VALIDATION_ERROR",
  "message": "Invalid request data",
  "details": [
    {
      "field": "phone",
      "message": "Invalid phone format (+380XXXXXXXXX)"
    }
  ]
}
```

**Unauthorized:**
```json
{
  "success": false,
  "error": "UNAUTHORIZED",
  "message": "Authentication token required"
}
```

**Rate Limit:**
```json
{
  "success": false,
  "error": "TOO_MANY_REQUESTS",
  "message": "Too many requests, please try again later"
}
```

---

## 🚦 Rate Limiting

### Ліміти за типом запиту

| Endpoint Type | Limit | Window |
|--------------|-------|---------|
| General | 100 requests | 15 minutes |
| Auth (login) | 5 attempts | 15 minutes |
| QR Generate | 10 requests | 5 minutes |
| Admin | 50 requests | 15 minutes |

### Headers
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1703340000
```

---

## ✅ Валідація

Використовується **Zod** для валідації схем.

### Phone Validation
```typescript
phone: z.string().regex(/^\+380\d{9}$/)
```

### Email Validation
```typescript
email: z.string().email()
```

### Number Validation
```typescript
balance: z.number().min(0)
amount: z.number().positive()
```

---

## 📝 Логування

### Request Log
Всі запити логуються в `logs/api.log`:
```json
{
  "timestamp": "2025-12-23T12:00:00.000Z",
  "method": "GET",
  "url": "/api/v2/client/me",
  "ip": "127.0.0.1",
  "userAgent": "...",
  "statusCode": 200,
  "responseTime": 45
}
```

### Error Log
Помилки логуються в `logs/error.log`:
```json
{
  "timestamp": "2025-12-23T12:00:00.000Z",
  "method": "POST",
  "url": "/api/v2/qr/generate",
  "ip": "127.0.0.1",
  "statusCode": 500,
  "error": "Database connection failed"
}
```

### Console Output
```
📥 GET /api/v2/client/me - 127.0.0.1
✅ GET /api/v2/client/me - 200 (45ms)
```

---

## 🧪 Тестування API

### Postman Collection
Імпортуйте колекцію з `docs/postman-collection.json`

### cURL Examples

**Login:**
```bash
curl -X POST http://localhost:3001/api/v2/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"+380960608968"}'
```

**Get Profile:**
```bash
curl http://localhost:3001/api/v2/client/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Generate QR:**
```bash
curl -X POST http://localhost:3001/api/v2/qr/generate \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+380960608968",
    "clientName": "Test User",
    "balance": 100
  }'
```

---

## 🔧 Конфігурація

### JWT Secret
Змініть в `.env`:
```env
JWT_SECRET=your-secure-secret-key-here
```

### Admin Phones
Редагуйте в `middleware/auth.middleware.ts`:
```typescript
const ADMIN_PHONES = [
  '+380960608968',
  '+380501234567',
];
```

### Rate Limits
Змініть в `middleware/rateLimiter.middleware.ts`

---

## 🚀 Deployment

### Production Checklist
- [ ] Змінити `JWT_SECRET`
- [ ] Встановити `NODE_ENV=production`
- [ ] Налаштувати CORS для production domains
- [ ] Налаштувати HTTPS
- [ ] Налаштувати database connection pool
- [ ] Налаштувати log rotation
- [ ] Додати monitoring (PM2, New Relic)

---

## 📊 Performance

- **Async/Await** - Неблокуючий I/O
- **Connection Pooling** - Ефективне використання БД
- **Rate Limiting** - Захист від перевантаження
- **Request Validation** - Раннє відхилення невалідних запитів

---

## 🆘 Підтримка

**API Documentation:** http://localhost:3001/api/docs
**Health Check:** http://localhost:3001/health

---

Створено з ❤️ для Nova Syla Loyalty
