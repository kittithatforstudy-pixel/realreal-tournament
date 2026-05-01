import { NextResponse } from 'next/server'
import supabase from '@/lib/supabase'
import { getCurrentUser } from '@/lib/auth'

export async function PUT(request, { params }) {
  try {
    const session = await getCurrentUser()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const { action } = await request.json()
    if (!['accept', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'action ต้องเป็น accept หรือ reject' }, { status: 400 })
    }

    const { data: me } = await supabase
      .from('User')
      .select('id, email, username')
      .eq('id', session.userId)
      .maybeSingle()
    if (!me) return NextResponse.json({ error: 'ไม่พบบัญชี' }, { status: 404 })

    const { data: invite } = await supabase
      .from('TournamentInvite')
      .select('*')
      .eq('id', id)
      .maybeSingle()
    if (!invite) return NextResponse.json({ error: 'ไม่พบคำเชิญ' }, { status: 404 })

    // Verify the invite is addressed to this user (by userId, email, or username)
    const matchesUserId = invite.userId && invite.userId === me.id
    const matchesEmail = invite.email && me.email && invite.email.toLowerCase() === me.email.toLowerCase()
    const matchesUsername = invite.username && me.username && invite.username.toLowerCase() === me.username.toLowerCase()
    if (!matchesUserId && !matchesEmail && !matchesUsername) {
      return NextResponse.json({ error: 'คำเชิญนี้ไม่ใช่ของคุณ' }, { status: 403 })
    }
    if (invite.status !== 'PENDING') {
      return NextResponse.json({ error: 'คำเชิญนี้ถูกตอบกลับแล้ว' }, { status: 409 })
    }

    const { data: updated, error } = await supabase
      .from('TournamentInvite')
      .update({
        status: action === 'accept' ? 'ACCEPTED' : 'REJECTED',
        userId: me.id,
        respondedAt: new Date().toISOString()
      })
      .eq('id', id)
      .select('*, tournament:Tournament(id, name)')
      .single()
    if (error) throw error

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Respond invite error:', error)
    return NextResponse.json({ error: 'ตอบรับคำเชิญไม่สำเร็จ' }, { status: 500 })
  }
}
