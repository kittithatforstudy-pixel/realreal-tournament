import { NextResponse } from 'next/server'
import supabase from '@/lib/supabase'
import { requireAdmin } from '@/lib/auth'

export async function GET() {
  try {
    await requireAdmin()
    const { data: payments, error } = await supabase
      .from('Payment')
      .select('*, registration:Registration(*, tournament:Tournament(id, name), user:User(id, username, displayName))')
      .eq('status', 'PENDING')
      .order('createdAt', { ascending: false })
    if (error) throw error
    return NextResponse.json(payments || [])
  } catch (error) {
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}
