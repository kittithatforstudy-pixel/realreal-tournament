import { NextResponse } from 'next/server'
import supabase from '@/lib/supabase'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getCurrentUser()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const [{ data: user }, { data: registrations }, { data: teamMemberships }] = await Promise.all([
      supabase
        .from('User')
        .select('id, email, username, displayName, avatar, phone, role, discordId, lineId, createdAt')
        .eq('id', session.userId)
        .maybeSingle(),
      supabase
        .from('Registration')
        .select('*, tournament:Tournament(id, name, status, startsAt, entryFee, game:Game(name, icon)), team:Team(id, name, inviteCode), payments:Payment(*)')
        .eq('userId', session.userId)
        .order('createdAt', { ascending: false }),
      supabase
        .from('TeamMember')
        .select('*, team:Team(id, name, tournamentId, inviteCode)')
        .eq('userId', session.userId)
    ])

    if (!user) return NextResponse.json({ error: 'ไม่พบบัญชี' }, { status: 404 })

    return NextResponse.json({
      user,
      registrations: registrations || [],
      teamMemberships: teamMemberships || []
    })
  } catch (error) {
    console.error('Get me error:', error)
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}

export async function PUT(request) {
  try {
    const session = await getCurrentUser()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    // Only allow self-editable profile fields.
    const allowed = ['displayName', 'phone', 'discordId', 'lineId', 'avatar']
    const update = {}
    for (const k of allowed) {
      if (k in body) {
        const v = body[k]
        update[k] = (v === '' || v == null) ? null : String(v).trim()
      }
    }
    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: 'ไม่มีข้อมูลให้บันทึก' }, { status: 400 })
    }
    update.updatedAt = new Date().toISOString()

    const { data: user, error } = await supabase
      .from('User')
      .update(update)
      .eq('id', session.userId)
      .select('id, email, username, displayName, avatar, phone, role, discordId, lineId, createdAt')
      .single()
    if (error) throw error

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Update me error:', error)
    return NextResponse.json({ error: 'อัปเดตไม่สำเร็จ' }, { status: 500 })
  }
}
