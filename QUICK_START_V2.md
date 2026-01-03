# 🚀 Потужне API v2.0 - Швидкий Старт

## Що було створено?

### 1. **Middleware Система** 🛡️
- ✅ `auth.middleware.ts` - JWT аутентифікація з Bearer tokens
- ✅ `validation.middleware.ts` - Zod schemas для валідації
- ✅ `rateLimiter.middleware.ts` - Захист від DDoS
- ✅ `logger.middleware.ts` - Детальне логування запитів

### 2. **API v2 Routes** 📡
- ✅ `auth.v2.ts` - Login, verify, refresh, logout
- ✅ `client.v2.ts` - Profile, balance, transactions
- ✅ `qr.v2.ts` - Generate, validate, use, history
- ✅ `admin.v2.ts` - Stats, users, promotions, logs

### 3. **Utilities** 🔧
- ✅ `response.util.ts` - Стандартизовані відповіді

### 4. **Документація** 📚
- ✅ `API_V2_DOCUMENTATION.md` - Повна документація
- ✅ Swagger-style endpoints documentation

---

## 🏃 Швидкий запуск

### Варіант 1: Новий сервер (рекомендовано)
```bash
cd backend
npm run dev:v2
```

Якщо команди немає, додайте в `package.json`:
```json
"scripts": {
  "dev:v2": "ts-node-dev --respawn --transpile-only src/server.v2.ts"
}
```

### Варіант 2: Тимчасово змінити server.ts
Перейменуйте файли:
```bash
mv src/server.ts src/server.old.ts
mv src/server.v2.ts src/server.ts
npm run dev
```

---

## 🔑 Ключові Переваги

### 1. JWT Authentication
```javascript
// Before (v1): Без токенів, просто phone перевірка
// After (v2): JWT Bearer tokens з expiry

// Login
POST /api/v2/auth/login
Response: { token: "eyJhbGciOiJ..." }

// Use token
GET /api/v2/client/me
Headers: { Authorization: "Bearer eyJhbGci..." }
```

### 2. Request Validation
```javascript
// Before (v1): Ручна перевірка в кожному endpoint
// After (v2): Zod schemas + middleware

router.post('/generate', 
  validate(schemas.generateQr),  // Auto-validation ✨
  handler
);
```

### 3. Rate Limiting
```javascript
// Before (v1): Немає захисту
// After (v2): Різні ліміти для різних endpoints

authLimiter      // 5 requests per 15 min
qrLimiter        // 10 requests per 5 min
adminLimiter     // 50 requests per 15 min
```

### 4. Standardized Responses
```javascript
// Before (v1): Різні формати в різних endpoints
// After (v2): Єдиний формат

sendSuccess(res, data, message, statusCode, meta);
sendError(res, errorCode, message, statusCode, details);
sendPaginated(res, data, page, limit, total);
```

### 5. Request Logging
```javascript
// Before (v1): console.log в різних місцях
// After (v2): Централізоване логування

// Logs/api.log - всі запити
// Logs/error.log - тільки помилки
// Console - красиво форматовано
```

---

## 📊 Порівняння v1 vs v2

| Feature | v1 (Old) | v2 (New) |
|---------|----------|----------|
| Authentication | ❌ None | ✅ JWT Bearer |
| Validation | Manual | ✅ Zod Schemas |
| Rate Limiting | ❌ None | ✅ Multi-tier |
| Error Handling | Inconsistent | ✅ Standardized |
| Logging | console.log | ✅ File + Console |
| Response Format | Mixed | ✅ Uniform |
| Admin Protection | ❌ None | ✅ Role-based |
| API Versioning | ❌ None | ✅ /api/v2/* |
| Documentation | Basic | ✅ Complete |

---

## 🧪 Тестування

### 1. Login і отримати токен
```bash
curl -X POST http://localhost:3001/api/v2/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"+380960608968"}'
```

Відповідь:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "phone": "+380960608968",
      "name": "Шимон Василь Васильович",
      "balance": 1250
    }
  }
}
```

### 2. Використати токен
```bash
TOKEN="your_token_here"

curl http://localhost:3001/api/v2/client/me \
  -H "Authorization: Bearer $TOKEN"
```

### 3. Генерувати QR
```bash
curl -X POST http://localhost:3001/api/v2/qr/generate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+380960608968",
    "clientName": "Тест",
    "balance": 100
  }'
```

---

## 🔄 Міграція Flutter додатку

### До (v1):
```dart
// lib/services/api_service.dart
static const baseUrl = 'http://localhost:3001/api';

// Простий POST без токенів
final response = await http.post(
  Uri.parse('$baseUrl/auth/login'),
  body: json.encode({'phone': phone}),
);
```

### Після (v2):
```dart
// lib/services/api_service.dart
static const baseUrl = 'http://localhost:3001/api/v2';
String? _token;

// Login і зберегти токен
Future<void> login(String phone) async {
  final response = await http.post(
    Uri.parse('$baseUrl/auth/login'),
    body: json.encode({'phone': phone}),
  );
  
  final data = json.decode(response.body);
  _token = data['data']['token'];
  await storage.write('jwt_token', _token);
}

// Використовувати токен в запитах
Future<Map<String, dynamic>> getProfile() async {
  final response = await http.get(
    Uri.parse('$baseUrl/client/me'),
    headers: {
      'Authorization': 'Bearer $_token',
    },
  );
  return json.decode(response.body);
}
```

---

## 📁 Структура файлів

```
backend/src/
├── server.ts          # Старий сервер (v1)
├── server.v2.ts       # ⭐ Новий потужний сервер
├── middleware/        # ⭐ Нова директорія
│   ├── auth.middleware.ts
│   ├── validation.middleware.ts
│   ├── rateLimiter.middleware.ts
│   └── logger.middleware.ts
├── routes/
│   ├── auth.ts        # v1
│   ├── auth.v2.ts     # ⭐ v2
│   ├── client.v2.ts   # ⭐ v2
│   ├── qr.v2.ts       # ⭐ v2
│   └── admin.v2.ts    # ⭐ v2
├── utils/             # ⭐ Нова директорія
│   └── response.util.ts
└── config/
    └── database.ts
```

---

## 🎯 Наступні кроки

### 1. Запустити новий сервер
```bash
cd backend
npm run dev:v2  # або npm run dev якщо перейменували
```

### 2. Перевірити документацію
Відкрийте в браузері:
- http://localhost:3001/ - API overview
- http://localhost:3001/api/docs - Детальна документація
- http://localhost:3001/health - Health check

### 3. Оновити Flutter додаток
- Додати JWT токени
- Оновити API endpoints на /api/v2/*
- Додати обробку помилок

### 4. Production готовність
- [ ] Змінити JWT_SECRET в .env
- [ ] Налаштувати CORS для production
- [ ] Додати HTTPS
- [ ] Налаштувати log rotation
- [ ] Додати monitoring

---

## 🐛 Troubleshooting

### Помилка: "Cannot find module"
```bash
cd backend
npm install
```

### Помилка: "JWT secret not defined"
Додайте в `.env`:
```
JWT_SECRET=your-secret-key-2025
```

### Port вже зайнятий
```bash
# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Або змініть порт в .env
PORT=3002
```

---

## 💡 Корисні команди

```bash
# Перевірити все працює
curl http://localhost:3001/health

# Перевірити API docs
curl http://localhost:3001/api/docs

# Тестовий login
curl -X POST http://localhost:3001/api/v2/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"+380960608968"}'

# Переглянути логи
tail -f backend/logs/api.log
tail -f backend/logs/error.log
```

---

## 🎉 Що далі?

API v2.0 готове до використання! Всі основні компоненти на місці:

✅ Authentication
✅ Validation
✅ Rate Limiting
✅ Error Handling
✅ Logging
✅ Documentation
✅ Security

Тепер можна:
1. Запустити новий сервер
2. Протестувати endpoints
3. Інтегрувати з Flutter додатком
4. Розширювати функціональність

**Детальна документація:** `backend/API_V2_DOCUMENTATION.md`
