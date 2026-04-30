import { NextResponse } from 'next/server'
import supabase from '@/lib/supabase'
import { requireAdmin } from '@/lib/auth'
import { isValidDiscordWebhookUrl } from '@/lib/discord'

export async function GET(request, { params }) {
  try {
    const { id } = await params

    const [{ data: tournament }, { data: teams }, { data: registrations }, { data: matches }] = await Promise.all([
      supabase.from('Tournament').select('*, game:Game(*)').eq('id', id).single(),
      supabase.from('Team').select('*, members:TeamMember(*, user:User(id, username, displayName))').eq('tournamentId', id),
      supabase.from('Registration').select('*, user:User(id, username, displayName), payments:Payment(*)').eq('tournamentId', id),
      supabase
        .from('Match')
        .select('*, participantA:Team!participantAId(id, name), participantB:Team!participantBId(id, name), winner:Team!winnerId(id, name)')
        .eq('tournamentId', id)
        .order('round')
        .order('matchNumber')
    ])

    if (!tournament) return NextResponse.json({ error: 'ไม่พบทัวร์นาเมนต์' }, { status: 404 })

    // Enrich teams with leader info
    const teamsWithLeaders = await Promise.all((teams || []).map(async team => {
      const { data: leader } = await supabase.from('User').select('id, username, displayName').eq('id', team.leaderId).single()
      return { ...team, leader }
    }))

    return NextResponse.json({
      ...tournament,
      teams: teamsWithLeaders,
      registrations: registrations || [],
      matches: matches || [],
      _count: { registrations: (registrations || []).length, teams: (teams || []).length }
    })
  } catch (error) {
    console.error('Get tournament error:', error)
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}

export async function PUT(request, { params }) {
  try {
    await requireAdmin()
    const { id } = await params
    const data = await request.json()
    if ('discordWebhook' in data && !isValidDiscordWebhookUrl(data.discordWebhook)) {
      return NextResponse.json({ error: 'Discord webhook URL ไม่ถูกต้อง' }, { status: 400 })
    }
    // Strip server-managed and relational fields the client must not write directly
    const { id: _id, game, teams, registrations, matches, _count, createdBy, createdAt, updatedAt, ...updateData } = data
    const { data: tournament, error } = await supabase.from('Tournament')
      .update({ ...updateData, updatedAt: new Date().toISOString() })
      .eq('id', id)
      .select('*, game:Game(*)')
      .single()
    if (error) throw error
    return NextResponse.json(tournament)
  } catch (error) {
    if (error.message === 'Forbidden') return NextResponse.json({ error: 'ไม่มีสิทธิ์' }, { status: 403 })
    console.error('Update tournament error:', error)
    return NextResponse.json({ error: 'อัปเดตไม่สำเร็จ' }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    await requireAdmin()
    const { id } = await params
    const { error } = await supabase.from('Tournament').delete().eq('id', id)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error) {
    if (error.message === 'Forbidden') return NextResponse.json({ error: 'ไม่มีสิทธิ์' }, { status: 403 })
    console.error('Delete tournament error:', error)
    return NextResponse.json({ error: 'ลบไม่สำเร็จ' }, { status: 500 })
  }
}
