# 🚂 Railway Manual Setup

Railway CLI має проблеми з кирилицею в шляхах. Використайте веб-інтерфейс:

## Крок 1: Створення проекту

1. Відкрийте https://railway.app/new
2. Натисніть **"Empty Project"**
3. Назвіть проект: **nova-syla-api**

## Крок 2: Налаштування через Dashboard

### Settings → Environment:

Додайте змінні:
```
NODE_ENV=production
PORT=3001
DB_SERVER=10.131.10.25
DB_DATABASE=AZIT
DB_USER=zeus
DB_PASSWORD=zeus
DB_PORT=1433
BINOTEL_KEY=035963-ac29f32
BINOTEL_SECRET=b3aa55-bf46d3-b0e6a6-99dc8a-8f8a984c
BINOTEL_COMPANY_ID=57612
JWT_SECRET=nova_syla_loyalty_secret_key_2024
```

### Settings → Networking:

1. Натисніть **"Generate Domain"**
2. Скопіюйте згенерований URL

## Крок 3: Деплой

### Варіант A: GitHub (рекомендовано)

1. **Settings → Service → Source**
2. **Connect Repo**
3. Оберіть ваш GitHub репозиторій
4. Root Directory: **backend**
5. Railway автоматично почне деплой

### Варіант B: Railway CLI (якщо не працює init)

```bash
# В проекті на Railway отримайте токен
# Settings → Tokens → Create Token

# Встановіть токен
$env:RAILWAY_TOKEN="your-token-here"

# Деплой
railway up
```

### Варіант C: Альтернативний хостинг

Якщо Railway не працює, є альтернативи:

**1. Vercel** (для Node.js)
```bash
npm i -g vercel
vercel
```

**2. Fly.io**
```bash
fly launch
fly deploy
```

**3. Cloudflare Workers** (потребує адаптації)

## Крок 4: Після деплою

Оновіть URL у Flutter:

**lib/config/api_config.dart:**
```dart
static const String baseUrl = 'https://YOUR-APP.up.railway.app/api/v2';
```

Перезбілдіть:
```bash
flutter build web --release
surge build/web nova-syla-loyalty.surge.sh
```

## 🔍 Перевірка

```bash
curl https://YOUR-APP.up.railway.app/health
```

Має повернути:
```json
{
  "status": "OK",
  "timestamp": "2026-01-03T..."
}
```
