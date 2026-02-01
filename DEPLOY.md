# Deploy (PaaS) — OnlyClass LMS

Backend + frontend **bitta Node app** ichida (Express static `public/`), MongoDB esa **Atlas**.

## 1) MongoDB Atlas
1. Atlas’da cluster yarating (Free tier ham bo‘ladi).
2. Database user yarating (username/password).
3. Network Access:
   - vaqtincha: `0.0.0.0/0` (keyinroq restrict qiling).
4. Connection string (URI) oling va `MONGODB_URI` ga qo‘ying.

## 2) Environment variables (majburiy)

- `NODE_ENV=production`
- `MONGODB_URI=...`
- `JWT_ACCESS_SECRET=...` (uzun random)
- `JWT_REFRESH_SECRET=...` (uzun random)
- `ADMIN_PASSWORD=...` (kuchli)

Ixtiyoriy:
- `APP_ORIGIN=https://your-domain.uz` (frontend boshqa origin bo‘lsa)
- `SEED_DEMO=false` (production’da demo seedni o‘chiring)
- `ADMIN_EMAIL=admin@onlyclass.local` (xohlasangiz o‘zgartiring)

## 3) Render (oddiy)
Render dashboard’da new Web Service:
- Build Command: `npm install`
- Start Command: `npm start`
- Health Check Path: `/api/health`
- Environment variables: yuqoridagilar

## 4) Railway
Railway:
- Start: `npm start`
- Variables: yuqoridagilar

## 5) Fly.io
Fly’da Node app deploy qilib, env varlarni set qiling.

## 6) Domain + HTTPS
PaaS’da custom domain ulaysiz va automatic TLS yoqasiz.

## 7) Production checklist
- `SEED_DEMO=false`
- `ADMIN_PASSWORD` ni kuchli qiling
- Atlas backup yoqing
- `/api/health` monitoring (uptime) qo‘ying

## 8) Production ops (minimal)
- **Logging**: PaaS log stream (Render/Railway/Fly) orqali kuzating.
- **Error tracking (ixtiyoriy)**: Sentry kabi servis ulab, 500 errorlarni tez toping.
- **Monitoring**: uptime monitor’ni `/api/health` ga qo‘ying (endpoint `db.readyState` ham qaytaradi).

