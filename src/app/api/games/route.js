import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

export async function GET() {
  try {
    const games = await prisma.game.findMany({
      where: { isActive: true },
      include: { _count: { select: { tournaments: true } } },
      orderBy: { name: 'asc' }
    })
    return NextResponse.json(games)
  } catch (error) {
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    await requireAdmin()
    const data = await request.json()

    const game = await prisma.game.create({ data })
    return NextResponse.json(game, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'เพิ่มเกมไม่สำเร็จ' }, { status: 500 })
  }
}
