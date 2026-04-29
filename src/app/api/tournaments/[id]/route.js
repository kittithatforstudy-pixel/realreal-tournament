import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

// GET /api/tournaments/[id]
export async function GET(request, { params }) {
  try {
    const { id } = await params

    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: {
        game: true,
        teams: {
          include: {
            leader: { select: { id: true, username: true, displayName: true } },
            members: { include: { user: { select: { id: true, username: true, displayName: true } } } }
          }
        },
        registrations: {
          include: {
            user: { select: { id: true, username: true, displayName: true } },
            payments: true
          }
        },
        matches: {
          include: {
            participantA: true,
            participantB: true,
            winner: true
          },
          orderBy: [{ round: 'asc' }, { matchNumber: 'asc' }]
        },
        _count: { select: { registrations: true, teams: true } }
      }
    })

    if (!tournament) {
      return NextResponse.json({ error: 'ไม่พบทัวร์นาเมนต์' }, { status: 404 })
    }

    return NextResponse.json(tournament)
  } catch (error) {
    console.error('Get tournament error:', error)
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}

// PUT /api/tournaments/[id]
export async function PUT(request, { params }) {
  try {
    await requireAdmin()
    const { id } = await params
    const data = await request.json()

    const tournament = await prisma.tournament.update({
      where: { id },
      data,
      include: { game: true }
    })

    return NextResponse.json(tournament)
  } catch (error) {
    if (error.message === 'Forbidden') {
      return NextResponse.json({ error: 'ไม่มีสิทธิ์' }, { status: 403 })
    }
    return NextResponse.json({ error: 'อัปเดตไม่สำเร็จ' }, { status: 500 })
  }
}

// DELETE /api/tournaments/[id]
export async function DELETE(request, { params }) {
  try {
    await requireAdmin()
    const { id } = await params

    await prisma.tournament.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'ลบไม่สำเร็จ' }, { status: 500 })
  }
}
