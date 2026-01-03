# Безпека бази даних AZIT

## Впроваджені захисти

### 1. API Key автентифікація
- SQL HTTP Proxy вимагає `X-API-Key` header
- 256-bit ключ генерується криптографічно безпечно
- Unauthorized доступ блокується (HTTP 401)

### 2. CORS обмеження
```javascript
allowedOrigins = [
  'https://nova-syla-api-production.up.railway.app',
  'http://localhost:3001',  // тільки для dev
]
```
Інші домени НЕ можуть робити запити.

### 3. Блокування небезпечних SQL команд
Заборонені операції:
- `DROP TABLE` / `DROP DATABASE`
- `TRUNCATE`
- `EXEC()` / `EXECUTE()`
- `xp_cmdshell` (системні команди)
- `sp_executesql`

### 4. Cloudflare Tunnel шифрування
- TLS 1.3 шифрування трафіку
- Немає прямого доступу до localhost:3002
- Тільки через Cloudflare CDN

### 5. Railway змінні середовища
Чутливі дані зберігаються як environment variables:
- `DATABASE_PROXY_URL` - URL тунелю (динамічний)
- `SQL_PROXY_API_KEY` - секретний ключ
- `BINOTEL_KEY` / `BINOTEL_SECRET`

## Конфігурація

### Railway Variables (обов'язково):
```
SQL_PROXY_API_KEY=a384063276316771afdf3e51060fe622b6cce9cc01c4001272a7e93e2ea9e792
DATABASE_PROXY_URL=https://lit-having-ips-optical.trycloudflare.com
```

### Локальний запуск:
```powershell
$env:SQL_PROXY_API_KEY = 'a384063276316771afdf3e51060fe622b6cce9cc01c4001272a7e93e2ea9e792'
node sql-http-proxy.js
```

## Додаткові рекомендації

### ❗ Для production:
1. **Named Cloudflare Tunnel** замість Quick Tunnel
   - Фіксований домен (не змінюється при перезапуску)
   - Власний піддомен (наприклад, sql.novasylagroup.com)

2. **SQL Read-Only користувач**
   ```sql
   CREATE USER 'readonly_api' WITH PASSWORD 'strong_pass';
   GRANT SELECT ON AZIT TO readonly_api;
   ```

3. **Rate Limiting**
   - Обмежити кількість запитів (наприклад, 100/хв)
   - Захист від DDoS

4. **Моніторинг та логування**
   - Cloudwatch / Datadog
   - Алерти при підозрілій активності
   - Логи всіх SQL запитів

5. **IP Whitelist (опціонально)**
   - Дозволити тільки Railway IP адреси
   - Додатковий рівень захисту

6. **Регулярна ротація ключів**
   - Змінювати SQL_PROXY_API_KEY кожні 90 днів

## Поточний статус

✅ API Key автентифікація активна
✅ CORS обмежений до Railway
✅ Небезпечні SQL команди заблоковані
✅ TLS шифрування через Cloudflare
⚠️ Quick Tunnel (URL змінюється при рестарті)
⚠️ Користувач 'zeus' має повні права (потрібен readonly)

## Архітектура безпеки

```
Internet
    ↓
[Cloudflare CDN] ← TLS 1.3 шифрування
    ↓
[Cloudflare Tunnel] ← Автентифіковане з'єднання
    ↓
[SQL HTTP Proxy] ← X-API-Key перевірка
  ├─ CORS check
  ├─ Dangerous SQL block
  └─ Parameter validation
    ↓
[MSSQL AZIT] ← Локальна мережа 10.131.10.25:1433
```

## У разі компрометації ключа:

1. Згенерувати новий ключ:
   ```powershell
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

2. Оновити в Railway Variables

3. Перезапустити локальний SQL Proxy

4. Перевірити логи на підозрілі запити

---

**Дата останнього оновлення:** 3 січня 2026
**Версія безпеки:** 1.0
**Відповідальний:** ZeuS
