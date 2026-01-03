# Nova Syla Loyalty API Server

Backend API для додатку Nova Syla Loyalty.

## Встановлення

```bash
cd backend
npm install
```

## Налаштування

Відредагуйте `.env` файл з вашими даними:

```env
PORT=3000
DB_SERVER=10.131.10.25
DB_DATABASE=AZIT
DB_USER=zeus
DB_PASSWORD=zeus
DB_PORT=1433
```

## Запуск

### Розробка (з hot reload)
```bash
npm run dev
```

### Production
```bash
npm run build
npm start
```

## API Endpoints

### Аутентифікація

#### POST /api/auth/login
Логін клієнта за номером телефону.

**Request:**
```json
{
  "phone": "+380685552629"
}
```

**Response (успіх):**
```json
{
  "success": true,
  "message": "Клієнта знайдено",
  "data": {
    "clientId": "123",
    "phone": "+380685552629",
    "name": "Іван Петренко",
    "balance": 1250,
    "level": "Бронза"
  }
}
```

**Response (не знайдено):**
```json
{
  "success": false,
  "message": "Клієнта з таким номером не знайдено"
}
```

#### GET /api/auth/check/:phone
Перевірка існування клієнта.

**Response:**
```json
{
  "success": true,
  "exists": true
}
```

### Клієнт

#### GET /api/client/:phone
Отримати повні дані клієнта.

**Response:**
```json
{
  "success": true,
  "data": {
    "clientId": "123",
    "phone": "+380685552629",
    "name": "Іван Петренко",
    "balance": 1250,
    "level": "Бронза",
    "email": "ivan@example.com",
    "city": "Мукачево"
  }
}
```

### Health Check

#### GET /health
Перевірка стану сервера.

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2025-12-20T10:30:00.000Z"
}
```

## Структура проекту

```
backend/
├── src/
│   ├── config/
│   │   └── database.ts      # Налаштування БД
│   ├── routes/
│   │   ├── auth.ts          # Роути аутентифікації
│   │   └── client.ts        # Роути клієнта
│   ├── types/
│   │   └── index.ts         # TypeScript типи
│   └── server.ts            # Головний файл
├── .env                     # Змінні оточення
├── package.json
├── tsconfig.json
└── README.md
```

## Тестування

### Через curl
```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"phone\": \"+380685552629\"}"

# Check
curl http://localhost:3000/api/auth/check/+380685552629

# Get client
curl http://localhost:3000/api/client/+380685552629
```

### Через Postman
Імпортуйте колекцію або використовуйте endpoints вище.

## Безпека

- ✅ Helmet.js для HTTP заголовків
- ✅ CORS налаштований
- ✅ Input валідація
- ✅ Prepared statements (SQL injection protection)
- ✅ Error handling

## TODO

- [ ] JWT токени для авторизації
- [ ] Rate limiting
- [ ] Логування в файл
- [ ] Додаткові endpoints (історія, QR, баланс)
- [ ] Тести (Jest)
