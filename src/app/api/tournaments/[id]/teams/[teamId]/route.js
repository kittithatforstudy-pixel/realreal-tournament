import { NextResponse } from 'next/server'
import supabase from '@/lib/supabase'
import { requireAdmin } from '@/lib/auth'

export async function PUT(request, { params }) {
  try {
    await requireAdmin()
    const { id, teamId } = await params
    const { name } = await request.json()
    if (!name?.trim()) return NextResponse.json({ error: 'กรุณากรอกชื่อทีม' }, { status: 400 })

    const { data: team, error } = await supabase
      .from('Team')
      .update({ name: name.trim() })
      .eq('id', teamId)
      .eq('tournamentId', id)
      .select('id, name')
      .single()

    if (error) throw error
    if (!team) return NextResponse.json({ error: 'ไม่พบทีม' }, { status: 404 })
    return NextResponse.json(team)
  } catch (error) {
    if (error.message === 'Forbidden') return NextResponse.json({ error: 'ไม่มีสิทธิ์' }, { status: 403 })
    console.error('Rename team error:', error)
    return NextResponse.json({ error: 'แก้ไขชื่อไม่สำเร็จ' }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    await requireAdmin()
    const { id, teamId } = await params

    // Delete in order: TeamMember → Team
    await supabase.from('TeamMember').delete().eq('teamId', teamId)
    const { error } = await supabase.from('Team').delete().eq('id', teamId).eq('tournamentId', id)
    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error.message === 'Forbidden') return NextResponse.json({ error: 'ไม่มีสิทธิ์' }, { status: 403 })
    console.error('Delete team error:', error)
    return NextResponse.json({ error: 'ลบทีมไม่สำเร็จ' }, { status: 500 })
  }
}
