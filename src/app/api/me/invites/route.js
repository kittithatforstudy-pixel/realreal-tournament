import { NextResponse } from 'next/server'
import supabase from '@/lib/supabase'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getCurrentUser()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: me } = await supabase
      .from('User')
      .select('id, email, username')
      .eq('id', session.userId)
      .maybeSingle()
    if (!me) return NextResponse.json({ error: 'ไม่พบบัญชี' }, { status: 404 })

    // Match invites by userId, email (case-insensitive), or username (case-insensitive)
    const filters = [`userId.eq.${me.id}`]
    if (me.email) filters.push(`email.ilike.${me.email}`)
    if (me.username) filters.push(`username.ilike.${me.username}`)

    const { data: invites, error } = await supabase
      .from('TournamentInvite')
      .select('*, tournament:Tournament(id, name, status, startsAt, entryFee, banner, inviteOnly, game:Game(name, icon))')
      .or(filters.join(','))
      .order('createdAt', { ascending: false })
    if (error) throw error

    return NextResponse.json(invites || [])
  } catch (error) {
    console.error('Get invites error:', error)
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}
