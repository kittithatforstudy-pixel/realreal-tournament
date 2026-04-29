import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

export async function GET() {
  try {
    await requireAdmin()

    const payments = await prisma.payment.findMany({
      where: { status: 'PENDING' },
      include: {
        registration: {
          include: {
            tournament: { select: { id: true, name: true } },
            user: { select: { id: true, username: true, displayName: true } },
            team: { select: { id: true, name: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(payments)
  } catch (error) {
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}
