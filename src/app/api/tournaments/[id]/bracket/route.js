import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { generateSingleElimBracket, generateDoubleElimBracket, advanceWinner } from '@/lib/bracket'
import { getWebhook, notifyMatchResult } from '@/lib/discord'

// POST /api/tournaments/[id]/bracket — Generate bracket
export async function POST(request, { params }) {
  try {
    await requireAdmin()
    const { id } = await params

    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: {
        teams: true,
        registrations: { where: { status: 'CONFIRMED' }, include: { user: true } }
      }
    })

    if (!tournament) {
      return NextResponse.json({ error: 'ไม่พบทัวร์' }, { status: 404 })
    }

    // Delete existing matches
    await prisma.match.deleteMany({ where: { tournamentId: id } })

    // Get participants
    const participants = tournament.teamMode
      ? tournament.teams
      : tournament.registrations.map(r => ({ id: r.userId, name: r.user.username }))

    if (participants.length < 2) {
      return NextResponse.json({ error: 'ต้องมีผู้เข้าแข่งอย่างน้อย 2 คน/ทีม' }, { status: 400 })
    }

    // Generate matches
    let matches
    if (tournament.format === 'DOUBLE_ELIM') {
      matches = generateDoubleElimBracket(participants, tournament.seedingType)
    } else {
      matches = generateSingleElimBracket(participants, tournament.seedingType)
    }

    // Save to DB
    const created = await prisma.$transaction(
      matches.map(m => prisma.match.create({
        data: {
          tournamentId: id,
          round: m.round,
          matchNumber: m.matchNumber,
          bracket: m.bracket,
          participantAId: m.participantAId,
          participantBId: m.participantBId,
          winnerId: m.winnerId || null,
          scoreA: m.scoreA || 0,
          scoreB: m.scoreB || 0,
          status: m.status
        }
      }))
    )

    // Update tournament status
    await prisma.tournament.update({ where: { id }, data: { status: 'LIVE' } })

    return NextResponse.json({ success: true, matchCount: created.length })
  } catch (error) {
    console.error('Generate bracket error:', error)
    return NextResponse.json({ error: 'สร้าง bracket ไม่สำเร็จ' }, { status: 500 })
  }
}

// PUT /api/tournaments/[id]/bracket — Update match result
export async function PUT(request, { params }) {
  try {
    await requireAdmin()
    const { id } = await params
    const { matchId, scoreA, scoreB, winnerId } = await request.json()

    const match = await prisma.match.update({
      where: { id: matchId },
      data: {
        scoreA,
        scoreB,
        winnerId,
        status: 'FINISHED',
        finishedAt: new Date()
      },
      include: {
        participantA: true,
        participantB: true,
        winner: true,
        tournament: true
      }
    })

    // Advance winner to next round
    const allMatches = await prisma.match.findMany({
      where: { tournamentId: id },
      orderBy: [{ round: 'asc' }, { matchNumber: 'asc' }]
    })

    const updated = advanceWinner(allMatches, match)

    // Update next match in DB
    for (const m of updated) {
      if (m.id !== matchId) {
        await prisma.match.update({
          where: { id: m.id },
          data: {
            participantAId: m.participantAId,
            participantBId: m.participantBId,
            status: m.status
          }
        })
      }
    }

    // Discord notification
    const webhook = getWebhook(match.tournament.discordWebhook)
    await notifyMatchResult(
      webhook,
      match.tournament.name,
      match.winner?.name || 'TBD',
      match.winnerId === match.participantAId ? match.participantB?.name : match.participantA?.name,
      `${scoreA} - ${scoreB}`
    )

    return NextResponse.json({ success: true, match })
  } catch (error) {
    console.error('Update match error:', error)
    return NextResponse.json({ error: 'อัปเดตผลไม่สำเร็จ' }, { status: 500 })
  }
}
