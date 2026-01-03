# 🚂 Швидкий деплой на Railway

## Крок 1: Логін
```bash
railway login
```
Відкриється браузер для авторизації через GitHub.

## Крок 2: Ініціалізація проекту
```bash
cd backend
railway init
```
Оберіть "Empty Project" або "Create new project"

## Крок 3: Додавання змінних оточення
```bash
railway variables set NODE_ENV=production
railway variables set PORT=3001
railway variables set DB_SERVER=10.131.10.25
railway variables set DB_DATABASE=AZIT
railway variables set DB_USER=zeus
railway variables set DB_PASSWORD=zeus
railway variables set DB_PORT=1433
railway variables set BINOTEL_KEY=035963-ac29f32
railway variables set BINOTEL_SECRET=b3aa55-bf46d3-b0e6a6-99dc8a-8f8a984c
railway variables set BINOTEL_COMPANY_ID=57612
railway variables set JWT_SECRET=nova_syla_loyalty_secret_key_2024
```

## Крок 4: Деплой
```bash
railway up
```

## Крок 5: Отримання URL
```bash
railway domain
```

Або створіть домен в Dashboard:
```bash
railway open
```
Settings → Networking → Generate Domain

## 🎯 Готово!

Ваш API буде доступний за адресою:
```
https://nova-syla-api-production.up.railway.app
```

Оновіть URL у Flutter та перезбілдіть!
