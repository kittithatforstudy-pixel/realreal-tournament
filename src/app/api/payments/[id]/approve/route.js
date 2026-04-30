import { NextResponse } from 'next/server'
import supabase from '@/lib/supabase'
import { requireAdmin } from '@/lib/auth'

export async function PUT(request, { params }) {
  try {
    const admin = await requireAdmin()
    const { id } = await params
    const { action, rejectionReason } = await request.json()
    const now = new Date().toISOString()

    if (action === 'approve') {
      const { data: payment, error } = await supabase.from('Payment')
        .update({ status: 'APPROVED', approvedById: admin.userId, approvedAt: now })
        .eq('id', id).select().single()
      if (error) throw error
      if (payment?.registrationId) {
        await supabase.from('Registration').update({ status: 'CONFIRMED' }).eq('id', payment.registrationId)
      }
      return NextResponse.json({ success: true, payment })
    }

    if (action === 'reject') {
      const { data: payment, error } = await supabase.from('Payment')
        .update({ status: 'REJECTED', rejectionReason: rejectionReason || 'ไม่ผ่านการตรวจสอบ', approvedById: admin.userId, approvedAt: now })
        .eq('id', id).select().single()
      if (error) throw error
      if (payment?.registrationId) {
        await supabase.from('Registration').update({ status: 'CANCELLED' }).eq('id', payment.registrationId)
      }
      return NextResponse.json({ success: true, payment })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    if (error.message === 'Forbidden') return NextResponse.json({ error: 'ไม่มีสิทธิ์' }, { status: 403 })
    console.error('Approve payment error:', error)
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}
