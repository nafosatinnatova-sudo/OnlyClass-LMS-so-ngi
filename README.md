# OnlyClass LMS (Prototype)

Frontend: **Vanilla HTML/CSS/JS**  
Backend: **Node.js + Express + JWT (HttpOnly cookie auth)**  

## Ishga tushirish

1) Paketlarni o‘rnating:

```bash
npm install
```

2) Serverni ishga tushiring:

```bash
npm run dev
```

### Local MongoDB (tavsiya)
Agar kompyuteringizda MongoDB o‘rnatilmagan bo‘lsa, Docker orqali ishga tushiring:

```bash
docker compose up -d
```

Dev rejimda:
- Agar `MONGODB_URI` berilmasa — app avtomatik **in-memory MongoDB** (mongodb-memory-server) bilan ishga tushadi.
- Agar local MongoDB ishlatsangiz — `.env` ichida `MONGODB_URI=mongodb://127.0.0.1:27017/onlyclass` qilib qo‘ying.

3) Ochiladigan manzillar:

- Landing: `http://localhost:3000/`
- Kirish: `http://localhost:3000/login`
- Ro‘yxat: `http://localhost:3000/register`
- Dashboard: `http://localhost:3000/dashboard`

## Production uchun (internetga chiqarish)

### 1) MongoDB Atlas
- Atlas’da cluster yarating
- Database user yarating
- `MONGODB_URI` ni oling

### 2) Environment variables
`.env.example` faylga qarang va hosting (Render/Railway/Fly) dashboard’ida quyidagilarni qo‘ying:

- `NODE_ENV=production`
- `MONGODB_URI=...`
- `JWT_ACCESS_SECRET=...` (uzun random)
- `JWT_REFRESH_SECRET=...` (uzun random)
- `ADMIN_PASSWORD=...` (kuchli parol)
- (ixtiyoriy) `APP_ORIGIN=https://your-domain.uz` (frontend boshqa origin bo‘lsa)
- (tavsiya) `SEED_DEMO=false` (production’da demo seedni o‘chiring)

Deploy bo‘yicha: `DEPLOY.md`.

## Admin demo

- Email: `admin@onlyclass.local`
- Password: `OnlyClass123!`

## Demo akkauntlar

- Student: `student@onlyclass.local` / `Student123!`
- Teacher: `teacher@onlyclass.local` / `Teacher123!`

Admin:
- Foydalanuvchini **Teacher/Student** qilish
- **Block/Unblock**
- **Yo‘nalish** (track) qo‘shish

## Role logic

- Ro‘yxatdan o‘tgan har bir foydalanuvchi default **Student**
- Faqat Admin: **Student → Teacher**, **Teacher → Student**, **Block/Unblock**
- Admin UI’da `OnlyClass` nomi bilan ko‘rinadi

## LMS oqimlari (dashboard ichida)

- **Video darslar**: Yo‘nalish → Ustoz profili → Darslar (chapda scroll list) → Video player + komment
- **Testlar**: Yo‘nalish → Ustoz → Test → Timer (har savol max 15s) → 1-urinish saqlanadi
- **Qo‘llanmalar**: Yo‘nalish → Ustoz → PDF list → download count
- **Statistika**: Students / Teachers bo‘limlari (hamma rol ko‘ra oladi)

## Ma’lumotlar qayerda saqlanadi?

- Production: **MongoDB Atlas** (Mongoose)
- Dev: **in-memory MongoDB** (default) yoki local MongoDB (`docker compose up -d`)

