import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

// PUT /api/payments/[id]/approve
export async function PUT(request, { params }) {
  try {
    const admin = await requireAdmin()
    const { id } = await params
    const { action, rejectionReason } = await request.json()

    if (action === 'approve') {
      const payment = await prisma.payment.update({
        where: { id },
        data: {
          status: 'APPROVED',
          approvedById: admin.userId,
          approvedAt: new Date()
        },
        include: { registration: true }
      })

      // Auto-confirm registration
      await prisma.registration.update({
        where: { id: payment.registrationId },
        data: { status: 'CONFIRMED' }
      })

      return NextResponse.json({ success: true, payment })

    } else if (action === 'reject') {
      const payment = await prisma.payment.update({
        where: { id },
        data: {
          status: 'REJECTED',
          rejectionReason: rejectionReason || 'ไม่ผ่านการตรวจสอบ',
          approvedById: admin.userId,
          approvedAt: new Date()
        }
      })

      return NextResponse.json({ success: true, payment })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}
