# ⚡ RealReal Tournament

แพลตฟอร์มจัดการทัวร์นาเมนต์แข่งเกมครบวงจร

## 🚀 Quick Start

### 1. Clone & Install
```bash
git clone <repo-url>
cd realreal-tournament
npm install
```

### 2. Setup Database
```bash
# สร้าง .env จาก template
cp .env.example .env

# แก้ไข DATABASE_URL ใน .env (ใช้ Supabase ฟรีได้)
# แก้ไข JWT_SECRET เป็นค่าสุ่มที่ปลอดภัย

# Push schema ไป database
npx prisma db push

# Seed ข้อมูลเริ่มต้น (games, admin user, templates)
npm run db:seed
```

### 3. Run
```bash
npm run dev
# เปิด http://localhost:3000
```

### 4. Login Admin
```
Email: admin@realreal.gg
Password: admin123
```

---

## 📁 โครงสร้างโปรเจกต์

```
realreal-tournament/
├── prisma/
│   ├── schema.prisma          # Database schema (ทุก model)
│   └── seed.js                # ข้อมูลเริ่มต้น
├── src/
│   ├── app/
│   │   ├── api/               # Backend API routes
│   │   │   ├── auth/          # Login, Register
│   │   │   ├── tournaments/   # CRUD ทัวร์ + สมัคร + bracket
│   │   │   ├── payments/      # Approve สลิป
│   │   │   ├── games/         # จัดการเกม
│   │   │   └── webhook/       # Discord webhook
│   │   ├── (site)/            # Frontend pages (ผู้เล่น)
│   │   ├── admin/             # Admin panel pages
│   │   ├── globals.css        # Tailwind CSS
│   │   ├── layout.js          # Root layout
│   │   └── page.js            # Homepage
│   ├── components/            # React components
│   │   ├── ui/                # Button, Input, Card, etc.
│   │   ├── tournament/        # Tournament cards, list
│   │   ├── admin/             # Admin dashboard, forms
│   │   └── bracket/           # Bracket visualization
│   └── lib/
│       ├── db.js              # Prisma client
│       ├── auth.js            # JWT auth utilities
│       ├── discord.js         # Discord webhook
│       └── bracket.js         # Bracket generator
├── .env.example               # Environment variables template
├── next.config.js             # Next.js config
├── tailwind.config.js         # Tailwind config
├── postcss.config.js          # PostCSS config
└── package.json               # Dependencies
```

---

## 🔧 Tech Stack

| ชั้น | เทคโนโลยี |
|---|---|
| Frontend | Next.js 14 + React + Tailwind CSS |
| Backend | Next.js API Routes |
| Database | PostgreSQL + Prisma ORM |
| Auth | JWT (httpOnly cookies) |
| Payments | Manual (PromptPay/Bank/TrueWallet + Slip upload) |
| Notifications | Discord Webhook |
| Deploy | Vercel + Supabase (แนะนำ) |

---

## 📋 Features

### ฝั่งผู้เล่น
- ✅ สมัครสมาชิก / เข้าสู่ระบบ
- ✅ ดูทัวร์ทั้งหมด (filter เกม, format, สถานะ)
- ✅ สมัครทัวร์ + สร้างทีม + ชวนเพื่อน
- ✅ ชำระเงิน (PromptPay/โอน/TrueWallet) + แนบสลิป
- ✅ ดู bracket live
- ✅ โปรไฟล์ + สถิติ

### ฝั่ง Admin
- ✅ Dashboard ภาพรวม
- ✅ สร้างทัวร์ (ตั้งค่าทุกอย่างได้อิสระ)
- ✅ จัดการเกม (เพิ่ม/แก้ไข/ลบ ไม่จำกัด)
- ✅ Approve สลิปการชำระเงิน
- ✅ สร้าง Bracket อัตโนมัติ (Single/Double Elim)
- ✅ กรอกผลแมตช์ + เลื่อนผู้ชนะอัตโนมัติ
- ✅ ระบบ Check-in
- ✅ Template กติกา (ใช้ซ้ำได้)
- ✅ แจ้งเตือนผู้เล่น (Email, Web, Discord)
- ✅ รายงานรายได้ + Export
- ✅ ตั้งค่า Branding (ชื่อ, logo, สี)
- ✅ Discord Webhook Integration

---

## 🌐 Deploy

### Option A: Vercel + Supabase (แนะนำ, ฟรี)

1. **Supabase** (Database)
   - ไปที่ supabase.com → New Project
   - Copy connection string → ใส่ใน DATABASE_URL

2. **Vercel** (Hosting)
   - Push code ไป GitHub
   - ไปที่ vercel.com → Import project
   - ตั้ง Environment Variables (DATABASE_URL, JWT_SECRET, etc.)
   - Deploy

### Option B: VPS (DigitalOcean/AWS)

```bash
# Install Node.js 18+
# Install PostgreSQL
# Clone repo
npm install
npm run build
npm start
```

---

## 🔐 Security Checklist

- [x] Password hashed with bcrypt (12 rounds)
- [x] JWT stored in httpOnly cookies
- [x] Admin routes protected with role check
- [x] Input validation on all endpoints
- [x] SQL injection prevention (Prisma ORM)
- [x] Environment variables for secrets
- [ ] HTTPS enforcement (Vercel handles this)
- [ ] Rate limiting on auth endpoints
- [ ] File upload validation
- [ ] PDPA compliance page

---

## 📞 Support

สร้างโดย Claude AI สำหรับ RealReal Tournament
