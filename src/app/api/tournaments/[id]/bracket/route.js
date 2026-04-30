import { NextResponse } from 'next/server'
import supabase from '@/lib/supabase'
import { requireAdmin } from '@/lib/auth'
import { generateSingleElimBracket, generateDoubleElimBracket, advanceWinner } from '@/lib/bracket'
import { getWebhook, notifyMatchResult } from '@/lib/discord'

export async function POST(request, { params }) {
  try {
    await requireAdmin()
    const { id } = await params

    const { data: tournament } = await supabase.from('Tournament').select('*').eq('id', id).single()
    if (!tournament) return NextResponse.json({ error: 'ไม่พบทัวร์' }, { status: 404 })

    let participants
    if (tournament.teamMode) {
      // Only teams whose registration is CONFIRMED
      const { data: confirmedRegs } = await supabase
        .from('Registration')
        .select('teamId')
        .eq('tournamentId', id)
        .eq('status', 'CONFIRMED')
        .not('teamId', 'is', null)
      const teamIds = (confirmedRegs || []).map(r => r.teamId)
      if (teamIds.length === 0) {
        return NextResponse.json({ error: 'ต้องมีทีมที่ยืนยันแล้วอย่างน้อย 2 ทีม' }, { status: 400 })
      }
      const { data: teams } = await supabase.from('Team').select('*').in('id', teamIds)
      participants = teams || []
    } else {
      const { data: regs } = await supabase
        .from('Registration')
        .select('*, user:User(id, username)')
        .eq('tournamentId', id)
        .eq('status', 'CONFIRMED')
      participants = (regs || []).map(r => ({ id: r.userId, name: r.user?.username || r.userId }))
    }

    if (participants.length < 2) {
      return NextResponse.json({ error: 'ต้องมีผู้เข้าแข่งที่ยืนยันแล้วอย่างน้อย 2 คน/ทีม' }, { status: 400 })
    }

    await supabase.from('Match').delete().eq('tournamentId', id)

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
    if (error.message === 'Forbidden') return NextResponse.json({ error: 'ไม่มีสิทธิ์' }, { status: 403 })
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
    const next = advanceWinner(allMatches || [], match)
    if (next) {
      await supabase.from('Match').update({
        participantAId: next.participantAId,
        participantBId: next.participantBId,
        status: next.status
      }).eq('id', next.id)
    }

    const { data: tournamentData } = await supabase.from('Tournament').select('name, discordWebhook').eq('id', id).single()
    const [{ data: winnerTeam }, { data: loserTeam }] = await Promise.all([
      winnerId ? supabase.from('Team').select('name').eq('id', winnerId).single() : Promise.resolve({ data: null }),
      winnerId ? supabase.from('Team').select('name').eq('id', winnerId === match.participantAId ? match.participantBId : match.participantAId).single() : Promise.resolve({ data: null })
    ])

    try {
      const webhook = getWebhook(tournamentData?.discordWebhook)
      await notifyMatchResult(webhook, tournamentData?.name, winnerTeam?.name || 'TBD', loserTeam?.name || 'TBD', `${scoreA} - ${scoreB}`)
    } catch (e) {
      console.error('Discord webhook error (ignored):', e)
    }

    return NextResponse.json({ success: true, match })
  } catch (error) {
    if (error.message === 'Forbidden') return NextResponse.json({ error: 'ไม่มีสิทธิ์' }, { status: 403 })
    console.error('Update match error:', error)
    return NextResponse.json({ error: 'อัปเดตผลไม่สำเร็จ' }, { status: 500 })
  }
}
