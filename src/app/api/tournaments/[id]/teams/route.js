import { NextResponse } from 'next/server'
import supabase from '@/lib/supabase'
import { requireAdmin } from '@/lib/auth'

export async function GET(request, { params }) {
  const { id } = await params
  const { data: teams, error } = await supabase
    .from('Team')
    .select('id, name, logo, createdAt')
    .eq('tournamentId', id)
    .order('createdAt')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(teams || [])
}

export async function POST(request, { params }) {
  try {
    const admin = await requireAdmin()
    const { id } = await params
    const { name } = await request.json()
    if (!name?.trim()) return NextResponse.json({ error: 'กรุณากรอกชื่อทีม' }, { status: 400 })

    const { data: tournament } = await supabase.from('Tournament').select('id, teamMode, maxParticipants').eq('id', id).single()
    if (!tournament) return NextResponse.json({ error: 'ไม่พบทัวร์นาเมนต์' }, { status: 404 })

    // Check slot
    const { count } = await supabase.from('Team').select('id', { count: 'exact', head: true }).eq('tournamentId', id)
    if (count >= tournament.maxParticipants) {
      return NextResponse.json({ error: `ทีมเต็มแล้ว (${count}/${tournament.maxParticipants})` }, { status: 400 })
    }

    // Create Team
    const { data: team, error: teamError } = await supabase
      .from('Team')
      .insert({ name: name.trim(), tournamentId: id, leaderId: admin.userId })
      .select('id, name, createdAt')
      .single()
    if (teamError) throw teamError

    // Create Registration (CONFIRMED) so the team is eligible for bracket
    const { data: reg, error: regError } = await supabase
      .from('Registration')
      .insert({ tournamentId: id, userId: admin.userId, teamId: team.id, status: 'CONFIRMED' })
      .select('id')
      .single()
    if (regError) {
      await supabase.from('Team').delete().eq('id', team.id)
      throw regError
    }

    // Add admin as LEADER member
    await supabase.from('TeamMember').insert({ teamId: team.id, userId: admin.userId, role: 'LEADER' })

    return NextResponse.json(team, { status: 201 })
  } catch (error) {
    if (error.message === 'Forbidden') return NextResponse.json({ error: 'ไม่มีสิทธิ์' }, { status: 403 })
    console.error('Add team error:', error)
    return NextResponse.json({ error: 'เพิ่มทีมไม่สำเร็จ: ' + error.message }, { status: 500 })
  }
}
