import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { getCurrentUser, requireAdmin } from '@/lib/auth'

// GET /api/tournaments — ดึงทัวร์ทั้งหมด (public)
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const gameId = searchParams.get('gameId')
    const format = searchParams.get('format')

    const where = {}
    if (status) where.status = status
    if (gameId) where.gameId = gameId
    if (format) where.format = format
    // Don't show drafts to public
    if (!status) where.status = { not: 'DRAFT' }

    const tournaments = await prisma.tournament.findMany({
      where,
      include: {
        game: true,
        _count: { select: { registrations: true, teams: true } }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(tournaments)
  } catch (error) {
    console.error('Get tournaments error:', error)
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}

// POST /api/tournaments — สร้างทัวร์ใหม่ (Admin only)
export async function POST(request) {
  try {
    const user = await requireAdmin()
    const data = await request.json()

    // Find or create game by name
    const gameName = (data.gameName || '').trim()
    if (!gameName) {
      return NextResponse.json({ error: 'กรุณาระบุชื่อเกม' }, { status: 400 })
    }
    let game = await prisma.game.findFirst({
      where: { name: { equals: gameName, mode: 'insensitive' } }
    })
    if (!game) {
      game = await prisma.game.create({
        data: { name: gameName, icon: '🎮', category: 'Other' }
      })
    }

    const { gameName: _, ...rest } = data
    const tournament = await prisma.tournament.create({
      data: {
        ...rest,
        gameId: game.id,
        createdById: user.userId,
        mapPool: data.mapPool || [],
        sponsorLogos: data.sponsorLogos || []
      },
      include: { game: true }
    })

    return NextResponse.json(tournament, { status: 201 })
  } catch (error) {
    if (error.message === 'Forbidden') {
      return NextResponse.json({ error: 'ไม่มีสิทธิ์' }, { status: 403 })
    }
    console.error('Create tournament error:', error)
    return NextResponse.json({ error: 'สร้างทัวร์ไม่สำเร็จ' }, { status: 500 })
  }
}
