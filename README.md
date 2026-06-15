# SavdoMarket — Sotuvchi & Ishlab chiqaruvchi platformasi

Sotuvchi (do'kon) bilan ishlab chiqaruvchi (firma) o'rtasidagi to'g'ridan-to'g'ri
buyurtma va muloqot platformasi. Uzum Market uslubidagi zamonaviy dizayn,
real chat, qabul/rad logikasi va production-darajadagi backend.

## Texnologiyalar
- **Backend:** Django 6 + DRF + JWT + PostgreSQL/SQLite (`backend/`)
- **Frontend:** Next.js 16 + React 19 + Tailwind v4 (`app/`)

---

## Asosiy imkoniyatlar

- **Ro'l asosida kirish:** sotuvchi va ishlab chiqaruvchi (har biri o'z paneli).
- **Katalog (sotuvchi):** qidiruv, kategoriya filtrlari, avtomatik aylanadigan karusel, sevimlilar.
- **Buyurtma oqimi:** sotuvchi buyurtma beradi → ishlab chiqaruvchi **qabul qiladi yoki rad etadi**.
  - Rad etishda **sabab** kiritiladi; sotuvchiga chat orqali avtomatik xabar boradi.
  - Rad etilgan buyurtmani sotuvchi **boshqa ishlab chiqaruvchidan qayta** bera oladi.
  - "Yuborildi" bo'lganda mahsulot zaxirasi avtomatik kamayadi.
- **Mahsulot boshqaruvi (firma):** qo'shish, **tahrirlash**, **o'chirish**.
- **Real chat:** sotuvchi ↔ ishlab chiqaruvchi xabarlashuvi, o'qildi belgisi, avtomatik yangilanish.
- **Pastki navigatsiya:** Asosiy · Sevimli · Buyurtmalar · Chat · Profil.
- **Xavfsizlik:** JWT, ro'l asosida ruxsat, har bir foydalanuvchi ma'lumoti izolyatsiya qilingan,
  so'rovlar soni cheklangan (throttling).

---

## 1. Backend (Django)

```bash
cd backend

# virtual muhit (tavsiya etiladi)
python -m venv venv
# Windows: venv\Scripts\activate
# Linux/Mac: source venv/bin/activate

pip install -r requirements.txt

# muhit faylini sozlash
cp .env.example .env       # keyin .env ichidagi qiymatlarni to'ldiring

python manage.py migrate
python seed.py             # namuna ma'lumotlar (ixtiyoriy)
python manage.py runserver
```

Backend: **http://127.0.0.1:8000** · Admin: `python manage.py createsuperuser`

## 2. Frontend (Next.js)

Yangi terminalda:

```bash
npm install
cp .env.local.example .env.local   # NEXT_PUBLIC_API_URL ni sozlang
npm run dev
```

Frontend: **http://localhost:3000**

### Sinov hisoblari (seed.py'dan keyin)
- Sotuvchi: `dokon@test.uz`
- Ishlab chiqaruvchi: `firma@test.uz`, `texno@test.uz`
- Parol: `parol1234`

---

## 3. Production'ga chiqarish

### Backend
1. `.env` da: `DEBUG=False`, kuchli `SECRET_KEY`, o'z `ALLOWED_HOSTS`, `DATABASE_URL` (PostgreSQL).
   ```
   DEBUG=False
   SECRET_KEY=<python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())">
   ALLOWED_HOSTS=api.domeningiz.uz
   DATABASE_URL=postgres://user:parol@host:5432/dbname
   DB_SSL=True
   CORS_ALLOWED_ORIGINS=https://domeningiz.uz
   CSRF_TRUSTED_ORIGINS=https://domeningiz.uz
   ```
2. Statik fayllar va migratsiya:
   ```bash
   python manage.py collectstatic --noinput
   python manage.py migrate
   ```
3. Gunicorn bilan ishga tushirish:
   ```bash
   gunicorn backend.wsgi:application --bind 0.0.0.0:8000 --workers 3
   ```
   (oldida Nginx reverse-proxy + HTTPS tavsiya etiladi)

`DEBUG=False` bo'lganda HTTPS, HSTS, xavfsiz cookie'lar avtomatik yoqiladi.

### Frontend
```bash
npm run build
npm start
```
`.env.local` da `NEXT_PUBLIC_API_URL=https://api.domeningiz.uz/api`.

---

## API endpointlar

| Metod | Manzil | Tavsif |
|-------|--------|--------|
| POST | `/api/auth/register/` | Ro'yxatdan o'tish |
| POST | `/api/auth/login/` | Kirish (JWT + user_id) |
| POST | `/api/auth/refresh/` | Token yangilash |
| GET | `/api/auth/me/` | Joriy foydalanuvchi |
| GET/POST/PATCH/DELETE | `/api/products/` | Mahsulotlar (yozish: faqat ishlab chiqaruvchi) |
| GET/POST | `/api/requests/` | Buyurtmalar |
| POST | `/api/requests/{id}/set_status/` | Qabul/rad/yuborildi (sabab bilan) |
| GET/POST | `/api/conversations/` | Suhbatlar |
| GET | `/api/conversations/{id}/messages/` | Xabarlar |
| POST | `/api/conversations/{id}/send/` | Xabar yuborish |
| GET | `/api/unread/` | O'qilmagan xabarlar soni |
| GET/POST/DELETE | `/api/favorites/` | Sevimlilar |

## Ma'lumotlar bazasi modellari
`User` (rol bilan) · `Product` · `Request` (status, rad sababi) · `Conversation` · `Message` · `Favorite`.
Har bir yozuv foreign key orqali egasiga bog'langan — foydalanuvchilar ma'lumoti alohida va izolyatsiya qilingan.
