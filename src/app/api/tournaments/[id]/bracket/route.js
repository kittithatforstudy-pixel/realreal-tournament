import { NextResponse } from 'next/server'
import supabase from '@/lib/supabase'
import { requireAdmin } from '@/lib/auth'
import { generateSingleElimBracket, generateDoubleElimBracket, advanceWinner } from '@/lib/bracket'
import { getWebhook, notifyMatchResult } from '@/lib/discord'

export async function POST(request, { params }) {
  try {
    await requireAdmin()
    const { id } = await params

    const [{ data: tournament }, { data: teams }, { data: registrations }] = await Promise.all([
      supabase.from('Tournament').select('*').eq('id', id).single(),
      supabase.from('Team').select('*').eq('tournamentId', id),
      supabase.from('Registration').select('*, user:User(id, username)').eq('tournamentId', id).eq('status', 'CONFIRMED')
    ])

    if (!tournament) return NextResponse.json({ error: 'ไม่พบทัวร์' }, { status: 404 })

    await supabase.from('Match').delete().eq('tournamentId', id)

    const participants = tournament.teamMode
      ? (teams || [])
      : (registrations || []).map(r => ({ id: r.userId, name: r.user?.username || r.userId }))

    if (participants.length < 2) return NextResponse.json({ error: 'ต้องมีผู้เข้าแข่งอย่างน้อย 2 คน/ทีม' }, { status: 400 })

    const matches = tournament.format === 'DOUBLE_ELIM'
      ? generateDoubleElimBracket(participants, tournament.seedingType)
      : generateSingleElimBracket(participants, tournament.seedingType)

    const matchRows = matches.map(m => ({
      id: crypto.randomUUID(),
      tournamentId: id,
      round: m.round,
      matchNumber: m.matchNumber,
      bracket: m.bracket,
      participantAId: m.participantAId || null,
      participantBId: m.participantBId || null,
      winnerId: m.winnerId || null,
      scoreA: m.scoreA || 0,
      scoreB: m.scoreB || 0,
      status: m.status,
      createdAt: new Date().toISOString()
    }))

    const { error } = await supabase.from('Match').insert(matchRows)
    if (error) throw error

    await supabase.from('Tournament').update({ status: 'LIVE', updatedAt: new Date().toISOString() }).eq('id', id)

    return NextResponse.json({ success: true, matchCount: matchRows.length })
  } catch (error) {
    console.error('Generate bracket error:', error)
    return NextResponse.json({ error: 'สร้าง bracket ไม่สำเร็จ' }, { status: 500 })
  }
}

export async function PUT(request, { params }) {
  try {
    await requireAdmin()
    const { id } = await params
    const { matchId, scoreA, scoreB, winnerId } = await request.json()

    const now = new Date().toISOString()
    const { data: match, error } = await supabase.from('Match')
      .update({ scoreA, scoreB, winnerId, status: 'FINISHED', finishedAt: now })
      .eq('id', matchId)
      .select('*')
      .single()
    if (error) throw error

    const { data: allMatches } = await supabase.from('Match').select('*').eq('tournamentId', id).order('round').order('matchNumber')
    const updated = advanceWinner(allMatches, match)
    for (const m of updated) {
      if (m.id !== matchId) {
        await supabase.from('Match').update({
          participantAId: m.participantAId,
          participantBId: m.participantBId,
          status: m.status
        }).eq('id', m.id)
      }
    }

    const { data: tournamentData } = await supabase.from('Tournament').select('name, discordWebhook').eq('id', id).single()
    const [{ data: winnerTeam }, { data: loserTeam }] = await Promise.all([
      winnerId ? supabase.from('Team').select('name').eq('id', winnerId).single() : Promise.resolve({ data: null }),
      winnerId ? supabase.from('Team').select('name').eq('id', winnerId === match.participantAId ? match.participantBId : match.participantAId).single() : Promise.resolve({ data: null })
    ])

    const webhook = getWebhook(tournamentData?.discordWebhook)
    await notifyMatchResult(webhook, tournamentData?.name, winnerTeam?.name || 'TBD', loserTeam?.name || 'TBD', `${scoreA} - ${scoreB}`)

    return NextResponse.json({ success: true, match })
  } catch (error) {
    console.error('Update match error:', error)
    return NextResponse.json({ error: 'อัปเดตผลไม่สำเร็จ' }, { status: 500 })
  }
}
