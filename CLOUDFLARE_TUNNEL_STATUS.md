# ВАЖЛИВО: Cloudflare Tunnel для AZIT SQL бази

## Поточна ситуація

База AZIT на `10.131.10.25:1433` доступна тільки з локальної мережі.  
Railway не може підключитися напряму.

## Рішення: SQL HTTP Proxy + Cloudflare Tunnel

### Що вже налаштовано:

1. **SQL HTTP Proxy** (`sql-http-proxy.js`):
   - Приймає HTTP POST запити з SQL queries
   - Виконує їх на AZIT базі
   - Повертає результати в JSON
   - Працює на `http://localhost:3002`

2. **Cloudflare Tunnel** (Named):
   - ID: `4ebb7f85-6e21-4fd4-b2ca-c194d10dad66`
   - Name: `nova-syla-sql-tunnel`
   - Проксує трафік з інтернету до локального proxy

### Проблема

Домен `ns_loyaliti.com` має статус "Invalid nameservers" - DNS не працює.

### Швидке рішення - Public Hostname

Використаємо `trycloudflare.com` для публічного доступу без DNS:

```powershell
# 1. Запустити SQL Proxy
cd "c:\src\Arhiv\nova_syla_loyalty TEST\backend"
node sql-http-proxy.js

# 2. В іншому терміналі запустити Quick Tunnel
cloudflared tunnel --url http://localhost:3002
```

Це дасть URL типу: `https://xxx-yyy-zzz.trycloudflare.com`

### Використання в Railway

```bash
# Додати до Railway Variables:
DB_PROXY_URL=https://xxx-yyy-zzz.trycloudflare.com
```

Backend код використовує проксі замість прямого підключення:

```javascript
// Замість mssql.connect()
const response = await axios.post(process.env.DB_PROXY_URL, {
  query: "EXEC AZIT.dbo.zeus_GetCli '+380679175108'"
});
```

### Постійне рішення

Змінити nameservers домену ns_loyaliti.com на:
- `eric.ns.cloudflare.com`  
- `raquel.ns.cloudflare.com`

Після активації DNS (5-30 хв) буде доступно:
`https://sqlproxy.ns-loyaliti.com`

## Запуск обох сервісів одночасно

```batch
start-sql-tunnel.bat
```

Або вручну:
```powershell
# Terminal 1
cd "c:\src\Arhiv\nova_syla_loyalty TEST\backend"
node sql-http-proxy.js

# Terminal 2  
cloudflared tunnel --url http://localhost:3002
```

## Тестування

```powershell
$url = "https://xxx-yyy-zzz.trycloudflare.com"
Invoke-RestMethod -Uri $url -Method POST -ContentType "application/json" -Body '{"query":"SELECT TOP 1 * FROM Clients"}'
```
