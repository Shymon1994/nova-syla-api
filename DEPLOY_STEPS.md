# 🚀 ДЕПЛОЙ НА RAILWAY - ПОКРОКОВА ІНСТРУКЦІЯ

## ✅ Крок 1: Запуште код на GitHub

```bash
# Створіть репозиторій на GitHub: https://github.com/new
# Назва: nova-syla-api

# Додайте remote та запуште
git remote add origin https://github.com/YOUR_USERNAME/nova-syla-api.git
git branch -M main
git push -u origin main
```

## ✅ Крок 2: Відкрийте Railway

Перейдіть на: **https://railway.app/new**

## ✅ Крок 3: Створіть проект

1. Натисніть **"Deploy from GitHub repo"**
2. Якщо Railway ще не підключений до GitHub:
   - Натисніть **"Configure GitHub App"**
   - Дайте доступ до репозиторію
3. Оберіть репозиторій **nova-syla-api**
4. Railway почне автоматичний деплой

## ✅ Крок 4: Налаштуйте змінні оточення

1. Клікніть на ваш сервіс
2. Перейдіть до вкладки **"Variables"**
3. Натисніть **"New Variable"**
4. Додайте кожну змінну:

```
NODE_ENV = production
PORT = 3001
DB_SERVER = 10.131.10.25
DB_DATABASE = AZIT
DB_USER = zeus
DB_PASSWORD = zeus
DB_PORT = 1433
BINOTEL_KEY = 035963-ac29f32
BINOTEL_SECRET = b3aa55-bf46d3-b0e6a6-99dc8a-8f8a984c
BINOTEL_COMPANY_ID = 57612
JWT_SECRET = nova_syla_loyalty_secret_key_2024
```

## ✅ Крок 5: Налаштуйте Root Directory

1. **Settings** → **Source**
2. **Root Directory**: вкажіть `backend` (якщо весь проект, залиште порожнім)
3. Збережіть

## ✅ Крок 6: Згенеруйте публічний URL

1. **Settings** → **Networking**
2. Натисніть **"Generate Domain"**
3. Скопіюйте згенерований URL (наприклад: `nova-syla-api-production.up.railway.app`)

## ✅ Крок 7: Дочекайтесь деплою

1. Перейдіть у вкладку **"Deployments"**
2. Зачекайте поки статус стане **"Active"** (1-3 хвилини)
3. Перегляньте логи на наявність помилок

## ✅ Крок 8: Перевірте API

Відкрийте в браузері:
```
https://YOUR-APP.up.railway.app/health
```

Має повернути:
```json
{
  "status": "OK",
  "timestamp": "2026-01-03T..."
}
```

## ✅ Крок 9: Оновіть Flutter додаток

Відредагуйте **lib/config/api_config.dart**:

```dart
class ApiConfig {
  static const String baseUrl = 'https://YOUR-APP.up.railway.app/api/v2';
  static const Duration timeout = Duration(seconds: 30);
  
  // ... rest of config
}
```

## ✅ Крок 10: Перезбілдіть та передеплойте веб

```bash
# Збілдіть Flutter веб
flutter build web --release

# Передеплойте на Surge
surge build/web nova-syla-loyalty.surge.sh
```

## 🎉 Готово!

**Frontend**: https://nova-syla-loyalty.surge.sh
**Backend API**: https://YOUR-APP.up.railway.app

---

## ⚠️ ВАЖЛИВО: Проблема з локальною БД

База даних `10.131.10.25` - це локальна адреса. Railway не зможе до неї підключитись!

### Рішення:

1. **Використати Railway PostgreSQL**:
   - В проекті: New → Database → PostgreSQL
   - Railway додасть `DATABASE_URL`
   - Потрібно міграція коду

2. **Azure SQL Database**:
   - Створіть БД на Azure
   - Отримайте публічну адресу
   - Оновіть `DB_SERVER`

3. **Cloudflare Tunnel**:
   - Створіть тунель до локальної БД
   - Безпечний публічний доступ

---

## 📞 Підтримка

Якщо виникли проблеми:
- Логи: Railway Dashboard → Deployments → View Logs
- Restart: Settings → Restart
- Railway Discord: https://discord.gg/railway
