-- Migration: invite-only tournaments + in-game name
-- Run this in Supabase SQL Editor (or `npx prisma db push` from local)

-- 1) Add inviteOnly flag to Tournament
ALTER TABLE "Tournament"
  ADD COLUMN IF NOT EXISTS "inviteOnly" BOOLEAN NOT NULL DEFAULT false;

-- 2) Add inGameName to Registration
ALTER TABLE "Registration"
  ADD COLUMN IF NOT EXISTS "inGameName" TEXT;

-- 3) Create InviteStatus enum (idempotent)
DO $$ BEGIN
  CREATE TYPE "InviteStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 4) Create TournamentInvite table
CREATE TABLE IF NOT EXISTS "TournamentInvite" (
  "id"          TEXT NOT NULL,
  "tournamentId" TEXT NOT NULL,
  "email"       TEXT,
  "username"    TEXT,
  "userId"      TEXT,
  "status"      "InviteStatus" NOT NULL DEFAULT 'PENDING',
  "invitedById" TEXT NOT NULL,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "respondedAt" TIMESTAMP(3),
  CONSTRAINT "TournamentInvite_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "TournamentInvite_tournamentId_fkey"
    FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "TournamentInvite_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "TournamentInvite_invitedById_fkey"
    FOREIGN KEY ("invitedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "TournamentInvite_tournamentId_idx" ON "TournamentInvite"("tournamentId");
CREATE INDEX IF NOT EXISTS "TournamentInvite_userId_idx"       ON "TournamentInvite"("userId");
CREATE INDEX IF NOT EXISTS "TournamentInvite_email_idx"        ON "TournamentInvite"("email");
CREATE INDEX IF NOT EXISTS "TournamentInvite_username_idx"     ON "TournamentInvite"("username");
