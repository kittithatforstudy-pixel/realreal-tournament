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
│   │   │   │   └── register/route.js
│   │   │   ├── tournaments/
│   │   │   │   ├── route.js                    # GET list, POST create
│   │   │   │   ├── [id]/route.js               # GET/PUT/DELETE
│   │   │   │   ├── [id]/register/route.js      # POST register + payment
│   │   │   │   └── [id]/bracket/route.js       # POST generate bracket
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
│   │   │   ├── [id]/page.js                    # Tournament detail
│   │   │   └── [id]/register/page.js           # Register + payment
│   │   │
│   │   ├── admin/
│   │   │   ├── layout.js                       # Sidebar layout
│   │   │   ├── page.js                         # Dashboard
│   │   │   ├── tournaments/page.js             # All tournaments
│   │   │   ├── tournaments/new/page.js         # Create new
│   │   │   ├── payments/page.js                # Approve slips
│   │   │   ├── games/page.js                   # Manage games
│   │   │   └── settings/page.js                # Branding settings
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
├── public/                                     # Static files
├── .env.example                                # Template
├── .gitignore
├── next.config.js
├── package.json
├── postcss.config.js                           # tailwindcss + autoprefixer
├── tailwind.config.js                          # Theme + fonts
├── jsconfig.json                               # Path aliases
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

### Admin User
- admin@realreal.gg / admin123 (SUPER_ADMIN)

### 10 Games
Valorant, RoV (Arena of Valor), PUBG Mobile, FIFA 26, Tekken 8, Street Fighter 6, League of Legends, Mobile Legends, Apex Legends, Free Fire

### 3 Rules Templates
- Valorant Standard
- Fighting Game Standard
- MOBA Standard

---

## ✅ สิ่งที่ทำเสร็จแล้ว

### Frontend Pages (User)
- [x] Homepage `/`
- [x] Tournament list `/tournaments` (filter by game/format/status)
- [x] Tournament detail `/tournaments/[id]`
- [x] Register + payment `/tournaments/[id]/register`
- [x] Login `/auth/login`
- [x] Register `/auth/register`

### Admin Panel
- [x] Dashboard `/admin` (stats + active tournaments + pending payments)
- [x] Tournament list `/admin/tournaments`
- [x] Create tournament `/admin/tournaments/new` (config ทุกอย่าง)
- [x] Approve payments `/admin/payments`
- [x] Manage games `/admin/games`
- [x] Settings `/admin/settings`

### Backend API (9 endpoints)
- [x] Auth: login, register
- [x] Tournaments: list, create, detail, update, delete, register, bracket
- [x] Payments: pending list, approve/reject
- [x] Games: list, create

### Libraries
- [x] `lib/auth.js` — JWT, bcrypt, requireAuth, requireAdmin
- [x] `lib/db.js` — Prisma singleton
- [x] `lib/bracket.js` — generateSingleElim, generateDoubleElim, advanceWinner
- [x] `lib/discord.js` — DiscordWebhook class + notify helpers

### Discord Webhook (Auto-notify)
- [x] When player registers
- [x] When payment slip submitted
- [x] When match result entered
- [x] When champion crowned

---

## 🚧 ยังไม่ได้ทำ (TODO)

### Frontend
- [ ] Bracket viewer (graphical visualization)
- [ ] Profile page
- [ ] Team management page (invite members, etc.)
- [ ] Check-in page (live)
- [ ] Match score entry (admin)
- [ ] Public results/leaderboard page

### Backend
- [ ] Image upload (currently base64 in localStorage — should use Cloudinary/Supabase Storage)
- [ ] Email notifications (currently only Discord)
- [ ] PlatformSettings API endpoint (settings page uses localStorage)
- [ ] Refresh token rotation
- [ ] Rate limiting on API routes

### DevOps
- [ ] Custom domain setup
- [ ] Sentry/error tracking
- [ ] Database backups (Supabase has built-in but only on paid)
- [ ] Cron jobs for tournament status auto-update

### UX
- [ ] Mobile menu (hamburger)
- [ ] Loading skeletons (currently just spinner)
- [ ] Toast notifications instead of alert()
- [ ] Tournament bracket drag-and-drop seeding

---

## 🔧 Common Tasks

### รัน locally
```bash
npm install
cp .env.example .env.local
# แก้ DATABASE_URL ใน .env.local
npx prisma db push
npm run db:seed
npm run dev
# http://localhost:3000
```

### Deploy
```bash
# แค่ push ไป main → Vercel auto-deploy
git add .
git commit -m "Update: ..."
git push
```

### Reset database (CAREFUL!)
```bash
npx prisma db push --force-reset
npm run db:seed
```

### ดู database GUI
```bash
npx prisma studio
# http://localhost:5555
```

### สร้าง migration ใหม่ (production)
```bash
npx prisma migrate dev --name describe_change
```

---

## 🎨 Design System

### Colors (Tailwind)
```
Primary:    #3b82f6 (blue-500)
Secondary:  #7c3aed (purple-600)
Success:    #10b981 (emerald-500)
Warning:    #f59e0b (amber-500)
Danger:     #ef4444 (red-500)
Dark text:  #111827 (gray-900)
```

### Theme
- Light theme (bg #f5f7fa, card #ffffff)
- Sidebar bg: #f8f9fa
- Border: #e5e7eb

### Custom CSS Classes (in globals.css)
- `.btn-primary` — Primary button
- `.btn-secondary` — Outline button
- `.card` — White rounded card
- `.input` — Form input
- `.label` — Form label
- `.badge` — Pill badge
- `.badge-open` / `.badge-live` / `.badge-closed`
- `.font-head` — Chakra Petch (headings)
- `.font-body` — IBM Plex Sans Thai (body)

---

## 📜 Coding Conventions

### File Style
- React: functional components only, hooks
- API routes: async functions, return `Response.json()`
- Prisma: use `db.js` singleton, never `new PrismaClient()` directly

### Naming
- Components: PascalCase (`TournamentCard.js`)
- API routes: lowercase (`route.js`)
- Helpers: camelCase
- Database fields: camelCase in code, snake_case auto-mapped by Prisma

### Auth Patterns
```javascript
// Protected route (any user)
import { requireAuth } from '@/lib/auth'
const user = await requireAuth(request)
if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

// Admin only
import { requireAdmin } from '@/lib/auth'
const admin = await requireAdmin(request)
if (!admin) return Response.json({ error: 'Forbidden' }, { status: 403 })
```

### Error Handling
- Always wrap API logic in try/catch
- Return user-friendly messages in Thai
- Log errors with `console.error`

---

## 🐛 Known Issues / Quirks

1. **Slip upload uses base64** — ควรเปลี่ยนเป็น Cloudinary หรือ Supabase Storage (large images กิน database)

2. **Tailwind v3 not v4** — เคยลอง v4 แล้วเจอ build error → ใช้ v3.4 แทน

3. **postinstall: prisma generate** — สำคัญ! Vercel ต้องการ ห้ามลบ

4. **JWT_SECRET ใน production** — ตอนนี้ใช้ "tournament-secret-2024" → เปลี่ยนเป็น random 32+ chars

5. **PlatformSettings API endpoint** — ยังไม่มี (settings page เก็บใน localStorage)

6. **Mobile menu** — ยังไม่มี hamburger สำหรับ admin sidebar บน mobile

---

## 💬 How to Talk to Claude Code

### ตัวอย่างคำสั่งดี

✅ **Specific:**
- "เพิ่มหน้า bracket viewer ที่ /tournaments/[id]/bracket แสดงเป็น tree visualization"
- "Fix bug: หน้า admin/payments approve แล้ว Discord ไม่ส่ง notification"
- "เปลี่ยน font size ใน .btn-primary เป็น 14px"
- "Refactor src/lib/bracket.js generateDoubleElimBracket — แยกเป็นฟังก์ชันย่อย"

❌ **Vague (ผมจะถามกลับ):**
- "ทำให้ดีขึ้น"
- "เพิ่มฟีเจอร์"
- "Fix bug" (bug ไหน?)

### Workflow
1. คุณบอกสิ่งที่อยากแก้
2. ผมอ่านไฟล์ที่เกี่ยวข้อง (อย่ากระโดดแก้)
3. ผมเสนอแผน → คุณ approve
4. ผมแก้ + test ที่ทำได้ + commit
5. Push → Vercel auto-deploy
6. คุณตรวจสอบ production

---

## 🔗 Quick Links

| Resource | URL |
|---|---|
| Production site | https://realreal-tournament.vercel.app |
| GitHub repo | https://github.com/kittithatforstudy-pixel/realreal-tournament |
| Vercel dashboard | https://vercel.com/dashboard |
| Supabase project | https://supabase.com/dashboard/project/osoqmehhznstuelouzcu |
| Discord webhook | (ใน .env เท่านั้น — อย่า commit) |

---

## 📞 Owner Info

- GitHub: kittithatforstudy-pixel
- Email: kittithatforstudy@gmail.com
- ทำงานเป็น: ผู้จัดทัวร์เกม (ไม่ใช่ developer fulltime)
- ภาษาที่ใช้คุย: ไทย (อังกฤษได้บ้าง)
- ระดับ: Beginner (ไม่เคยใช้ Git/GitHub/CLI ก่อน — ใช้เป็นแล้วในโปรเจคนี้)

**คำแนะนำ:**
- อธิบายเรียบง่าย ใช้ภาษาไทยเป็นหลัก
- ก่อนทำอะไรใหญ่ๆ ขอ confirm ก่อน
- บอก step-by-step เวลาให้คำสั่ง terminal
- ถ้าเจอ error อธิบายว่าเกิดอะไรขึ้น ก่อนแก้

---

**Last Updated:** 2026-04-29  
**Version:** 1.0.0
