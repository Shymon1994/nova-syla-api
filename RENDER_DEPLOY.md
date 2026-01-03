# 🚀 Деплой Nova Syla API на Render.com

## Крок 1: Підготовка

✅ Всі файли готові:
- `render.yaml` - конфігурація для Render
- `.node-version` - версія Node.js
- `package.json` - з правильними скриптами
- `.env` - локальні змінні (НЕ комітити!)

## Крок 2: Створення Git репозиторію (якщо ще не створено)

```bash
git init
git add .
git commit -m "Initial commit"
```

Створіть репозиторій на GitHub та запуште код:

```bash
git remote add origin https://github.com/YOUR_USERNAME/nova-syla-api.git
git branch -M main
git push -u origin main
```

## Крок 3: Деплой на Render

1. **Перейдіть на https://render.com**
2. **Зареєструйтесь або увійдіть**
3. **Натисніть "New +" → "Web Service"**
4. **Підключіть GitHub репозиторій**
5. **Налаштування:**
   - Name: `nova-syla-api`
   - Region: `Frankfurt (EU Central)`
   - Branch: `main`
   - Root Directory: `backend`
   - Runtime: `Node`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
   - Plan: `Free`

## Крок 4: Environment Variables

Додайте в Render Dashboard → Environment:

```env
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

⚠️ **ВАЖЛИВО**: База даних `10.131.10.25` - це локальна адреса. 
Для production потрібно:
- Або використовувати хмарну БД (Azure SQL, AWS RDS)
- Або налаштувати VPN/тунель до локальної мережі

## Крок 5: Оновлення Frontend

Після деплою оновіть API URL у Flutter:

**lib/config/api_config.dart:**
```dart
static const String baseUrl = 'https://nova-syla-api.onrender.com/api/v2';
```

Перезбілдіть і передеплойте:
```bash
flutter build web --release
surge build/web nova-syla-loyalty.surge.sh
```

## 🔗 URLs після деплою

- **Backend API**: https://nova-syla-api.onrender.com
- **Frontend**: https://nova-syla-loyalty.surge.sh
- **API Docs**: https://nova-syla-api.onrender.com/api/docs
- **Health Check**: https://nova-syla-api.onrender.com/health

## 📝 Примітки

- Free tier Render засипає після 15 хв неактивності
- Перший запит після "сну" займає ~30-60 секунд
- Для постійної роботи потрібен платний план ($7/міс)
- Логи доступні в Render Dashboard
