# CLAUDE.md — Project Context for Claude Code

> ไฟล์นี้ Claude Code จะอ่านอัตโนมัติเพื่อเข้าใจโปรเจค

---

## 📋 Project Overview

**ชื่อโปรเจค:** RealReal Tournament  
**ประเภท:** ระบบจัดการทัวร์นาเมนต์แข่งเกม (Full Production)  
**ภาษา UI:** ภาษาไทย  
**ผู้พัฒนา:** kittithatforstudy-pixel  

---

## 🎯 Purpose

ผู้ใช้จัดทัวร์นาเมนต์แข่งเกมเอง (ไม่ใช่ตัวกลาง/แพลตฟอร์มกลาง) ต้องการระบบเว็บจัดการทัวร์นาเมนต์เต็มรูปแบบ รองรับ:

- เกมหลากหลาย (เพิ่มได้ไม่จำกัด)
- ทีมและเดี่ยว (ขนาดทีม 1-20 คน)
- การชำระเงินไทย (PromptPay, ธนาคาร, TrueWallet)
- หลาย Format (Single/Double Elim, Round Robin, Swiss, Battle Royale, กลุ่ม+Playoff)
- Discord Webhook integration
- Branding customization (ชื่อ, logo, สี)

---

## 🛠 Tech Stack

```
Frontend:    Next.js 14 (App Router) + React 18 + Tailwind CSS 3.4
Backend:     Next.js API Routes (Node.js)
Database:    PostgreSQL (Supabase) + Prisma ORM 5.10
Auth:        JWT (httpOnly cookies) + bcryptjs
Hosting:     Vercel (auto-deploy from GitHub main)
Webhooks:    Discord (built-in lib)
Fonts:       Chakra Petch (heading) + IBM Plex Sans Thai (body)
```

---

## 🌐 Deployment Info

### GitHub Repository
```
URL: https://github.com/kittithatforstudy-pixel/realreal-tournament
Branch: main
Owner: kittithatforstudy-pixel
```

### Vercel
```
Auto-deploy: ON (push to main = deploy)
Production URL: https://realreal-tournament.vercel.app
Framework: Next.js
Build: prisma generate && next build
```

### Supabase Database
```
Project: realreal-tournament
Region: Singapore (ap-southeast-1)
Plan: Free (Nano)
URL: https://osoqmehhznstuelouzcu.supabase.co
```

### Environment Variables (ใน Vercel)
```
DATABASE_URL          → Supabase connection string
JWT_SECRET            → tournament-secret-2024
DISCORD_WEBHOOK_URL   → https://discord.com/api/webhooks/1498503834149064725/...
NEXT_PUBLIC_APP_URL   → https://realreal-tournament.vercel.app
NEXT_PUBLIC_APP_NAME  → RealReal Tournament
```

---

## 🔑 Default Credentials

### Admin Account
```
Email:    admin@realreal.gg
Password: admin123
Role:     SUPER_ADMIN
```

⚠️ **เปลี่ยนรหัส admin หลังจาก deploy production**

---

## 📁 Project Structure

```
realreal-tournament/
├── prisma/
│   ├── schema.prisma         # 12 models (User, Tournament, Team, etc.)
│   └── seed.js               # Admin + 10 games + rule templates
│
├── src/
│   ├── app/
│   │   ├── api/              # Backend endpoints
│   │   │   ├── auth/
│   │   │   │   ├── login/route.js
│   │   │   │   ├── logout/route.js
│   │   │   │   └── register/route.js
│   │   │   ├── tournaments/
│   │   │   │   ├── route.js                    # GET list, POST create
│   │   │   │   ├── [id]/route.js               # GET/PUT/DELETE
│   │   │   │   ├── [id]/register/route.js      # POST register + payment
│   │   │   │   └── [id]/bracket/route.js       # POST generate, PUT result
│   │   │   ├── payments/
│   │   │   │   ├── pending/route.js            # GET pending payments
│   │   │   │   └── [id]/approve/route.js       # PUT approve/reject
│   │   │   └── games/route.js                  # GET/POST games
│   │   │
│   │   ├── auth/
│   │   │   ├── login/page.js
│   │   │   └── register/page.js
│   │   │
│   │   ├── tournaments/
│   │   │   ├── page.js                         # Browse list
│   │   │   └── [id]/page.js                    # Tournament detail + register
│   │   │
│   │   ├── admin/
│   │   │   └── page.js                         # Dashboard + manage all
│   │   │
│   │   ├── profile/
│   │   │   └── page.js                         # User profile
│   │   │
│   │   ├── globals.css                         # Tailwind + Google Fonts
│   │   ├── layout.js                           # Root layout
│   │   └── page.js                             # Homepage
│   │
│   └── lib/
│       ├── auth.js                             # JWT, bcrypt, requireAuth
│       ├── db.js                               # Prisma client singleton
│       ├── bracket.js                          # Bracket generators
│       └── discord.js                          # Discord webhook helpers
│
├── .env.example
├── next.config.js
├── package.json
├── tailwind.config.js
└── README.md
```

---

## 💾 Database Schema (12 Models)

### Core Models
- **User** — id, email, username, passwordHash, displayName, role[PLAYER/ADMIN/SUPER_ADMIN], discordId, lineId
- **Game** — id, name, icon, category, defaultTeamSize, supportedFormats[], isActive
- **Tournament** — id, name, gameId, format, teamMode, teamSize, maxParticipants, bestOf, seedingType, entryFee, prizes, payment info, schedule, rules, branding, status[DRAFT/OPEN/CLOSED/LIVE/FINISHED]
- **Team** — id, name, logo, inviteCode, tournamentId, leaderId
- **TeamMember** — teamId, userId, role[LEADER/MEMBER/SUB]
- **Registration** — id, tournamentId, userId/teamId, status, checkedIn
- **Payment** — id, registrationId, amount, channel[PROMPTPAY/BANK_TRANSFER/TRUEWALLET], slipUrl, status[PENDING/APPROVED/REJECTED]
- **Match** — id, tournamentId, round, matchNumber, bracket[UPPER/LOWER/GRAND_FINAL], scoreA, scoreB, winnerId
- **RulesTemplate** — id, name, content, gameType
- **PlatformSettings** — global branding (singleton "main")

### Status Enums
```
TournamentStatus:    DRAFT, OPEN, CLOSED, LIVE, FINISHED, CANCELLED
RegistrationStatus:  PENDING, CONFIRMED, CANCELLED, DQ
PaymentStatus:       PENDING, APPROVED, REJECTED
MatchStatus:         PENDING, READY, LIVE, FINISHED
UserRole:            PLAYER, ADMIN, SUPER_ADMIN
```

---

## 🌱 Seed Data (npm run db:seed)

- admin@realreal.gg / admin123 (SUPER_ADMIN)
- 10 Games: Valorant, RoV, PUBG, FIFA 26, Tekken 8, SF6, LoL, ML, Apex, Free Fire
- 3 Rules Templates: Valorant Standard, Fighting Game Standard, MOBA Standard

---

## 🔧 Common Tasks

```bash
npm run dev          # http://localhost:3000
npm run build        # prisma generate && next build
npm run db:seed      # seed admin + games
npm run db:push      # push schema to DB
npx prisma studio    # GUI at http://localhost:5555
```

### Deploy
```bash
git add . && git commit -m "Update: ..." && git push
# Vercel auto-deploys on push to main
```

---

## 🎨 Design System

Custom CSS classes in `globals.css`:
- `.btn-primary` / `.btn-secondary` / `.btn-danger` / `.btn-success`
- `.card` — white rounded box with border + shadow
- `.input` / `.label` — form fields
- `.badge` + `.badge-open` / `.badge-live` / `.badge-closed`
- `font-head` — Chakra Petch, `font-body` — IBM Plex Sans Thai

---

## 🐛 Known Issues

1. **Tailwind v3 not v4** — ใช้ v3.4 (v4 มี build error)
2. **postinstall: prisma generate** — สำคัญสำหรับ Vercel ห้ามลบ
3. **JWT_SECRET ใน production** — เปลี่ยนเป็น random 32+ chars
4. **No /api/me endpoint** — profile page ยังไม่แสดง user data จริง

---

## 📞 Owner Info

- GitHub: kittithatforstudy-pixel
- Email: kittithatforstudy@gmail.com
- ภาษาที่ใช้คุย: ไทย
- ระดับ: Beginner — อธิบายให้เข้าใจง่าย บอก step-by-step

---

**Last Updated:** 2026-04-29  
**Version:** 1.0.0
