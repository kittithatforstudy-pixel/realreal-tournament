import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

export const maxDuration = 60

export async function GET(request) {
  const secret = request.nextUrl.searchParams.get('secret')
  if (secret !== 'realreal-seed-2024') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const prisma = new PrismaClient()
  const log = []

  try {
    // Step 1: Create all enums and tables
    log.push('Creating enums...')
    await prisma.$executeRawUnsafe(`DO $$ BEGIN
      CREATE TYPE "Role" AS ENUM ('PLAYER', 'ADMIN', 'SUPER_ADMIN');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;`)
    await prisma.$executeRawUnsafe(`DO $$ BEGIN
      CREATE TYPE "Format" AS ENUM ('SINGLE_ELIM', 'DOUBLE_ELIM', 'ROUND_ROBIN', 'SWISS', 'BATTLE_ROYALE', 'GROUP_PLAYOFF');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;`)
    await prisma.$executeRawUnsafe(`DO $$ BEGIN
      CREATE TYPE "SeedingType" AS ENUM ('RANDOM', 'MANUAL', 'RANKING');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;`)
    await prisma.$executeRawUnsafe(`DO $$ BEGIN
      CREATE TYPE "TournamentStatus" AS ENUM ('DRAFT', 'OPEN', 'CLOSED', 'LIVE', 'FINISHED', 'CANCELLED');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;`)
    await prisma.$executeRawUnsafe(`DO $$ BEGIN
      CREATE TYPE "TeamRole" AS ENUM ('LEADER', 'MEMBER', 'SUB');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;`)
    await prisma.$executeRawUnsafe(`DO $$ BEGIN
      CREATE TYPE "RegStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'DQ');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;`)
    await prisma.$executeRawUnsafe(`DO $$ BEGIN
      CREATE TYPE "PaymentChannel" AS ENUM ('PROMPTPAY', 'BANK_TRANSFER', 'TRUEWALLET', 'STRIPE', 'FREE');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;`)
    await prisma.$executeRawUnsafe(`DO $$ BEGIN
      CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;`)
    await prisma.$executeRawUnsafe(`DO $$ BEGIN
      CREATE TYPE "BracketType" AS ENUM ('UPPER', 'LOWER', 'GRAND_FINAL');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;`)
    await prisma.$executeRawUnsafe(`DO $$ BEGIN
      CREATE TYPE "MatchStatus" AS ENUM ('PENDING', 'READY', 'LIVE', 'FINISHED', 'CANCELLED');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;`)
    log.push('Enums OK')

    // Step 2: Create tables
    log.push('Creating tables...')
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "User" (
        "id" TEXT NOT NULL, "email" TEXT NOT NULL, "username" TEXT NOT NULL,
        "passwordHash" TEXT NOT NULL, "displayName" TEXT, "avatar" TEXT, "phone" TEXT,
        "role" "Role" NOT NULL DEFAULT 'PLAYER', "discordId" TEXT, "lineId" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "User_pkey" PRIMARY KEY ("id")
      );`)
    await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");`)
    await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "User_username_key" ON "User"("username");`)

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Game" (
        "id" TEXT NOT NULL, "name" TEXT NOT NULL, "icon" TEXT NOT NULL DEFAULT '🎮',
        "category" TEXT NOT NULL DEFAULT 'Other', "defaultTeamSize" INTEGER NOT NULL DEFAULT 5,
        "supportedFormats" TEXT[] DEFAULT ARRAY['SINGLE_ELIM','DOUBLE_ELIM']::TEXT[],
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Game_pkey" PRIMARY KEY ("id")
      );`)
    await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "Game_name_key" ON "Game"("name");`)

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "PlatformSettings" (
        "id" TEXT NOT NULL DEFAULT 'main', "platformName" TEXT NOT NULL DEFAULT 'RealReal Tournament',
        "tagline" TEXT NOT NULL DEFAULT 'จัดทัวร์นาเมนต์ยังไงก็ได้', "logoIcon" TEXT NOT NULL DEFAULT '⚡',
        "logoImage" TEXT, "colorPrimary" TEXT NOT NULL DEFAULT '#3b82f6',
        "colorSecondary" TEXT NOT NULL DEFAULT '#7c3aed', "contactLine" TEXT, "contactEmail" TEXT,
        "website" TEXT, "promptpayDefault" TEXT, "promptpayNameDefault" TEXT,
        "bankDefault" TEXT, "truewalletDefault" TEXT, "discordWebhookDefault" TEXT,
        "language" TEXT NOT NULL DEFAULT 'th', "customDomain" TEXT,
        CONSTRAINT "PlatformSettings_pkey" PRIMARY KEY ("id")
      );`)

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Tournament" (
        "id" TEXT NOT NULL, "name" TEXT NOT NULL, "description" TEXT, "banner" TEXT,
        "gameId" TEXT NOT NULL, "format" "Format" NOT NULL DEFAULT 'SINGLE_ELIM',
        "teamMode" BOOLEAN NOT NULL DEFAULT true, "teamSize" INTEGER NOT NULL DEFAULT 5,
        "maxParticipants" INTEGER NOT NULL DEFAULT 16, "bestOf" INTEGER NOT NULL DEFAULT 3,
        "bestOfFinal" INTEGER NOT NULL DEFAULT 5, "seedingType" "SeedingType" NOT NULL DEFAULT 'RANDOM',
        "allowSubs" BOOLEAN NOT NULL DEFAULT true, "maxSubs" INTEGER NOT NULL DEFAULT 2,
        "entryFee" DOUBLE PRECISION NOT NULL DEFAULT 0, "prizeFirst" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "prizeSecond" DOUBLE PRECISION NOT NULL DEFAULT 0, "prizeThird" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "prizeMVP" DOUBLE PRECISION NOT NULL DEFAULT 0, "promptpayNumber" TEXT, "promptpayName" TEXT,
        "promptpayQR" TEXT, "bankAccount" TEXT, "truewalletNumber" TEXT,
        "regOpenAt" TIMESTAMP(3), "regCloseAt" TIMESTAMP(3), "startsAt" TIMESTAMP(3), "endsAt" TIMESTAMP(3),
        "checkinMinutes" INTEGER NOT NULL DEFAULT 30, "dqMinutes" INTEGER NOT NULL DEFAULT 15,
        "rules" TEXT, "rulesTemplateId" TEXT, "mapPool" TEXT[] DEFAULT ARRAY[]::TEXT[],
        "notifyEmail" BOOLEAN NOT NULL DEFAULT true, "notifyWeb" BOOLEAN NOT NULL DEFAULT true,
        "notifyLine" BOOLEAN NOT NULL DEFAULT false, "notifyDiscord" BOOLEAN NOT NULL DEFAULT false,
        "discordWebhook" TEXT, "colorPrimary" TEXT NOT NULL DEFAULT '#3b82f6',
        "colorSecondary" TEXT NOT NULL DEFAULT '#7c3aed', "discordLink" TEXT, "lineLink" TEXT,
        "streamLink" TEXT, "sponsorLogos" TEXT[] DEFAULT ARRAY[]::TEXT[],
        "status" "TournamentStatus" NOT NULL DEFAULT 'DRAFT', "createdById" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Tournament_pkey" PRIMARY KEY ("id")
      );`)

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Team" (
        "id" TEXT NOT NULL, "name" TEXT NOT NULL, "logo" TEXT, "inviteCode" TEXT NOT NULL,
        "tournamentId" TEXT NOT NULL, "leaderId" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
      );`)
    await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "Team_inviteCode_key" ON "Team"("inviteCode");`)

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "TeamMember" (
        "id" TEXT NOT NULL, "teamId" TEXT NOT NULL, "userId" TEXT NOT NULL,
        "role" "TeamRole" NOT NULL DEFAULT 'MEMBER',
        "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "TeamMember_pkey" PRIMARY KEY ("id")
      );`)
    await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "TeamMember_teamId_userId_key" ON "TeamMember"("teamId", "userId");`)

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Registration" (
        "id" TEXT NOT NULL, "tournamentId" TEXT NOT NULL, "userId" TEXT NOT NULL, "teamId" TEXT,
        "status" "RegStatus" NOT NULL DEFAULT 'PENDING', "checkedIn" BOOLEAN NOT NULL DEFAULT false,
        "checkedInAt" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Registration_pkey" PRIMARY KEY ("id")
      );`)
    await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "Registration_tournamentId_userId_key" ON "Registration"("tournamentId", "userId");`)

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Payment" (
        "id" TEXT NOT NULL, "registrationId" TEXT NOT NULL, "amount" DOUBLE PRECISION NOT NULL,
        "channel" "PaymentChannel" NOT NULL DEFAULT 'PROMPTPAY', "slipUrl" TEXT,
        "transferredAt" TIMESTAMP(3), "note" TEXT, "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
        "approvedById" TEXT, "approvedAt" TIMESTAMP(3), "rejectionReason" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
      );`)

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Match" (
        "id" TEXT NOT NULL, "tournamentId" TEXT NOT NULL, "round" INTEGER NOT NULL,
        "matchNumber" INTEGER NOT NULL, "bracket" "BracketType" NOT NULL DEFAULT 'UPPER',
        "participantAId" TEXT, "participantBId" TEXT, "scoreA" INTEGER NOT NULL DEFAULT 0,
        "scoreB" INTEGER NOT NULL DEFAULT 0, "winnerId" TEXT, "status" "MatchStatus" NOT NULL DEFAULT 'PENDING',
        "scheduledAt" TIMESTAMP(3), "startedAt" TIMESTAMP(3), "finishedAt" TIMESTAMP(3), "nextMatchId" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
      );`)
    await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "Match_unique" ON "Match"("tournamentId", "round", "matchNumber", "bracket");`)

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "RulesTemplate" (
        "id" TEXT NOT NULL, "name" TEXT NOT NULL, "content" TEXT NOT NULL, "gameType" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "RulesTemplate_pkey" PRIMARY KEY ("id")
      );`)

    // Foreign keys (ignore if exists)
    await prisma.$executeRawUnsafe(`ALTER TABLE "Tournament" ADD CONSTRAINT "Tournament_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;`).catch(() => {})
    await prisma.$executeRawUnsafe(`ALTER TABLE "Tournament" ADD CONSTRAINT "Tournament_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;`).catch(() => {})
    await prisma.$executeRawUnsafe(`ALTER TABLE "Team" ADD CONSTRAINT "Team_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;`).catch(() => {})
    await prisma.$executeRawUnsafe(`ALTER TABLE "Team" ADD CONSTRAINT "Team_leaderId_fkey" FOREIGN KEY ("leaderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;`).catch(() => {})
    await prisma.$executeRawUnsafe(`ALTER TABLE "Registration" ADD CONSTRAINT "Registration_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;`).catch(() => {})
    await prisma.$executeRawUnsafe(`ALTER TABLE "Registration" ADD CONSTRAINT "Registration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;`).catch(() => {})
    await prisma.$executeRawUnsafe(`ALTER TABLE "Payment" ADD CONSTRAINT "Payment_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "Registration"("id") ON DELETE CASCADE ON UPDATE CASCADE;`).catch(() => {})
    await prisma.$executeRawUnsafe(`ALTER TABLE "Match" ADD CONSTRAINT "Match_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;`).catch(() => {})
    log.push('Tables OK')

    // Step 3: Seed admin user
    const adminHash = await bcrypt.hash('admin123', 12)
    const adminId = 'admin-user-001'
    await prisma.$executeRawUnsafe(`
      INSERT INTO "User" ("id","email","username","passwordHash","displayName","role","updatedAt")
      VALUES ('${adminId}','admin@realreal.gg','admin','${adminHash}','Admin','SUPER_ADMIN',NOW())
      ON CONFLICT ("email") DO UPDATE SET "role"='SUPER_ADMIN';`)
    log.push('Admin user: admin@realreal.gg / admin123')

    // Step 4: Seed games
    const games = [
      ['game-01','Valorant','🎯','FPS',5],
      ['game-02','RoV','⚔️','MOBA',5],
      ['game-03','PUBG','🔫','Battle Royale',4],
      ['game-04','FIFA 26','⚽','Sports',1],
      ['game-05','Tekken 8','👊','Fighting',1],
      ['game-06','Street Fighter 6','🥊','Fighting',1],
      ['game-07','League of Legends','🏰','MOBA',5],
      ['game-08','Mobile Legends','📱','MOBA',5],
      ['game-09','Apex Legends','🎖️','Battle Royale',3],
      ['game-10','Free Fire','🔥','Battle Royale',4],
    ]
    for (const [id, name, icon, category, teamSize] of games) {
      await prisma.$executeRawUnsafe(`
        INSERT INTO "Game" ("id","name","icon","category","defaultTeamSize")
        VALUES ('${id}','${name}','${icon}','${category}',${teamSize})
        ON CONFLICT ("name") DO NOTHING;`)
    }
    log.push(`${games.length} games seeded`)

    // Step 5: Platform settings
    await prisma.$executeRawUnsafe(`
      INSERT INTO "PlatformSettings" ("id","platformName","tagline","logoIcon")
      VALUES ('main','RealReal Tournament','จัดทัวร์นาเมนต์ยังไงก็ได้','⚡')
      ON CONFLICT ("id") DO NOTHING;`)
    log.push('Platform settings OK')

    return NextResponse.json({ success: true, log })
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message, log }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
