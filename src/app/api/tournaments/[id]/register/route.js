import { NextResponse } from 'next/server'
import supabase from '@/lib/supabase'
import { requireAuth } from '@/lib/auth'
import { getWebhook, notifyRegistration, notifyPayment } from '@/lib/discord'

export async function POST(request, { params }) {
  try {
    const user = await requireAuth()
    const { id } = await params
    const { teamName, slipUrl, amount, channel, transferredAt, note, inGameName } = await request.json()

    const cleanInGameName = (inGameName || '').trim()
    if (!cleanInGameName) {
      return NextResponse.json({ error: 'กรุณากรอกชื่อในเกม' }, { status: 400 })
    }

    const { data: tournament } = await supabase.from('Tournament').select('*').eq('id', id).single()
    if (!tournament) return NextResponse.json({ error: 'ไม่พบทัวร์นาเมนต์' }, { status: 404 })
    if (tournament.status !== 'OPEN') return NextResponse.json({ error: 'ทัวร์นาเมนต์ยังไม่เปิดรับสมัคร' }, { status: 400 })

    // Invite-only enforcement: must have an ACCEPTED invite for this user
    if (tournament.inviteOnly) {
      const { data: account } = await supabase.from('User').select('email, username').eq('id', user.userId).maybeSingle()
      const filters = [`userId.eq.${user.userId}`]
      if (account?.email) filters.push(`email.ilike.${account.email}`)
      if (account?.username) filters.push(`username.ilike.${account.username}`)
      const { data: invite } = await supabase
        .from('TournamentInvite')
        .select('id, status')
        .eq('tournamentId', id)
        .or(filters.join(','))
        .eq('status', 'ACCEPTED')
        .maybeSingle()
      if (!invite) {
        return NextResponse.json({ error: 'ทัวร์นี้เชิญเท่านั้น คุณต้องตอบรับคำเชิญก่อน' }, { status: 403 })
      }
    }

    if (slipUrl) {
      try {
        const u = new URL(slipUrl)
        if (u.protocol !== 'https:') throw new Error('not https')
      } catch {
        return NextResponse.json({ error: 'slipUrl ต้องเป็น HTTPS URL' }, { status: 400 })
      }
    }

    const { data: existing } = await supabase.from('Registration').select('id').eq('tournamentId', id).eq('userId', user.userId).maybeSingle()
    if (existing) return NextResponse.json({ error: 'คุณสมัครทัวร์นี้แล้ว' }, { status: 409 })

    // Capacity check: count current entries (teams in team mode, registrations in solo)
    if (tournament.teamMode) {
      const { count: teamCount } = await supabase.from('Team').select('id', { count: 'exact', head: true }).eq('tournamentId', id)
      if ((teamCount ?? 0) >= tournament.maxParticipants) {
        return NextResponse.json({ error: 'ทัวร์นาเมนต์เต็มแล้ว' }, { status: 400 })
      }
    } else {
      const { count: regCount } = await supabase.from('Registration').select('id', { count: 'exact', head: true }).eq('tournamentId', id)
      if ((regCount ?? 0) >= tournament.maxParticipants) {
        return NextResponse.json({ error: 'ทัวร์นาเมนต์เต็มแล้ว' }, { status: 400 })
      }
    }

    // Create team if team mode
    let team = null
    if (tournament.teamMode && teamName) {
      const { data: newTeam, error: teamError } = await supabase.from('Team').insert({
        id: crypto.randomUUID(),
        name: teamName,
        tournamentId: id,
        leaderId: user.userId,
        inviteCode: Math.random().toString(36).slice(2, 10).toUpperCase(),
        createdAt: new Date().toISOString()
      }).select().single()
      if (teamError) throw teamError
      team = newTeam

      await supabase.from('TeamMember').insert({
        id: crypto.randomUUID(),
        teamId: team.id,
        userId: user.userId,
        role: 'LEADER',
        joinedAt: new Date().toISOString()
      })
    }

    const { data: registration, error: regError } = await supabase.from('Registration').insert({
      id: crypto.randomUUID(),
      tournamentId: id,
      userId: user.userId,
      teamId: team?.id || null,
      inGameName: cleanInGameName,
      status: tournament.entryFee > 0 ? 'PENDING' : 'CONFIRMED',
      checkedIn: false,
      createdAt: new Date().toISOString()
    }).select().single()
    if (regError) throw regError

    // Atomic capacity enforcement: rank by createdAt; rollback if past capacity.
    // Catches the race where two concurrent signups both pass the pre-check.
    const { data: ordered } = tournament.teamMode
      ? await supabase.from('Team').select('id').eq('tournamentId', id).order('createdAt')
      : await supabase.from('Registration').select('id').eq('tournamentId', id).order('createdAt')
    const myId = tournament.teamMode ? team?.id : registration.id
    const position = (ordered || []).findIndex(r => r.id === myId)
    if (position === -1 || position >= tournament.maxParticipants) {
      await supabase.from('Registration').delete().eq('id', registration.id)
      if (team) await supabase.from('Team').delete().eq('id', team.id)
      return NextResponse.json({ error: 'ทัวร์นาเมนต์เต็มแล้ว' }, { status: 400 })
    }

    if (tournament.entryFee > 0 && slipUrl) {
      await supabase.from('Payment').insert({
        id: crypto.randomUUID(),
        registrationId: registration.id,
        amount: amount || tournament.entryFee,
        channel: channel || 'PROMPTPAY',
        slipUrl,
        transferredAt: transferredAt ? new Date(transferredAt).toISOString() : new Date().toISOString(),
        note: note || null,
        status: 'PENDING',
        createdAt: new Date().toISOString()
      })
    } else if (tournament.entryFee === 0) {
      await supabase.from('Payment').insert({
        id: crypto.randomUUID(),
        registrationId: registration.id,
        amount: 0,
        channel: 'FREE',
        status: 'APPROVED',
        createdAt: new Date().toISOString()
      })
    }

    // Discord webhooks must never break registration flow
    try {
      const webhook = getWebhook(tournament.discordWebhook)
      await notifyRegistration(webhook, user.username, tournament.name)
      if (slipUrl) await notifyPayment(webhook, teamName || user.username, tournament.name, amount || tournament.entryFee)
    } catch (e) {
      console.error('Discord webhook error (ignored):', e)
    }

    return NextResponse.json({
      success: true,
      registration: registration.id,
      team: team?.id,
      inviteCode: team?.inviteCode
    }, { status: 201 })
  } catch (error) {
    if (error.message === 'Unauthorized') return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 })
    console.error('Registration error:', error)
    return NextResponse.json({ error: 'สมัครไม่สำเร็จ' }, { status: 500 })
  }
}
