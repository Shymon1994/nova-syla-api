# Cloudflare Tunnel для Nova Syla API

## Крок 1: Створення тунелю

```powershell
# Авторизуйтесь в Cloudflare
cloudflared tunnel login

# Створіть новий тунель
cloudflared tunnel create nova-syla-sql-tunnel
```

Це створить файл credentials в `C:\Users\ZeuS\.cloudflared\<TUNNEL-ID>.json`

## Крок 2: Налаштування DNS

У Cloudflare Dashboard:
1. Виберіть ваш домен (або зареєструйте новий на Cloudflare)
2. DNS → Add Record:
   - Type: `CNAME`
   - Name: `sql` (або інше ім'я)
   - Target: `<TUNNEL-ID>.cfargotunnel.com`
   - Proxy status: Proxied (помаранчева хмарка)

Або через CLI:
```powershell
cloudflared tunnel route dns nova-syla-sql-tunnel sql.yourdomain.com
```

## Крок 3: Запуск тунелю

```powershell
cd "c:\src\Arhiv\nova_syla_loyalty TEST\backend"
cloudflared tunnel --config cloudflare-tunnel-config.yml run nova-syla-sql-tunnel
```

Або встановити як Windows Service:
```powershell
cloudflared service install
```

## Крок 4: Налаштування Railway

В Railway → Settings → Variables, додайте:

```
DB_SERVER=sql.yourdomain.com
DB_PORT=1433
DB_DATABASE=AZIT
DB_USER=zeus
DB_PASSWORD=zeus
DB_TRUST_SERVER_CERTIFICATE=true
```

## Альтернатива: Використання без домену

Якщо у вас немає домену, можете використовувати тунель напряму:

```powershell
# Запустіть quick tunnel (без авторизації)
cloudflared tunnel --url tcp://10.131.10.25:1433
```

Це дасть вам публічний URL (але він змінюється при кожному запуску).

## Автозапуск тунелю

Створіть планувальник завдань Windows:
1. Task Scheduler → Create Basic Task
2. Name: "Cloudflare SQL Tunnel"
3. Trigger: At system startup
4. Action: Start a program
   - Program: `C:\Program Files (x86)\cloudflared\cloudflared.exe`
   - Arguments: `tunnel --config "c:\src\Arhiv\nova_syla_loyalty TEST\backend\cloudflare-tunnel-config.yml" run nova-syla-sql-tunnel`
5. Finish

## Перевірка

```powershell
# Перевірте чи працює тунель
cloudflared tunnel info nova-syla-sql-tunnel

# Подивіться список активних тунелів
cloudflared tunnel list
```

## Безпека

⚠️ **ВАЖЛИВО:**
- SQL Server тепер доступний через інтернет
- Змініть паролі бази даних
- Налаштуйте firewall правила
- Використовуйте Cloudflare Access для додаткового захисту
- Розгляньте IP whitelisting в SQL Server

## Troubleshooting

Якщо Railway не може підключитися:
- Перевірте чи працює cloudflared на вашому ПК
- Перевірте логи: `cloudflared tunnel info`
- SQL Server має приймати remote connections (SQL Server Configuration Manager)
- Windows Firewall дозволяє порт 1433
