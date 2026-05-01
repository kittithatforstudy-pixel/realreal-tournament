import { NextResponse } from 'next/server'
import supabase from '@/lib/supabase'
import { requireAdmin } from '@/lib/auth'
import { isValidDiscordWebhookUrl } from '@/lib/discord'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const gameId = searchParams.get('gameId')
    const format = searchParams.get('format')

    const all = searchParams.get('all') === '1'

    let query = supabase
      .from('Tournament')
      .select('*, game:Game(*), teams:Team(id), registrations:Registration(id)')
      .order('createdAt', { ascending: false })
    if (status) query = query.eq('status', status)
    else if (!all) query = query.neq('status', 'DRAFT')
    if (gameId) query = query.eq('gameId', gameId)
    if (format) query = query.eq('format', format)

    const { data: tournaments, error } = await query
    if (error) throw error
    const result = (tournaments || []).map(t => {
      const { teams = [], registrations = [], ...rest } = t
      return { ...rest, _count: { teams: teams.length, registrations: registrations.length } }
    })
    return NextResponse.json(result)
  } catch (error) {
    console.error('Get tournaments error:', error)
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const user = await requireAdmin()
    const data = await request.json()

    const gameName = (data.gameName || '').trim()
    if (!gameName) return NextResponse.json({ error: 'กรุณาระบุชื่อเกม' }, { status: 400 })
    if (!isValidDiscordWebhookUrl(data.discordWebhook)) {
      return NextResponse.json({ error: 'Discord webhook URL ไม่ถูกต้อง' }, { status: 400 })
    }

    let { data: game } = await supabase.from('Game').select('id,name').ilike('name', gameName).maybeSingle()
    if (!game) {
      const { data: newGame, error } = await supabase.from('Game').insert({
        id: crypto.randomUUID(),
        name: gameName, icon: '🎮', category: 'Other', defaultTeamSize: 5,
        isActive: true, createdAt: new Date().toISOString()
      }).select().single()
      if (error) throw error
      game = newGame
    }

    // Strip server-managed and relational fields so client cannot override id, createdById, etc.
    const {
      id: _id, gameName: _gn, gameId: _gid, createdById: _cb, createdAt: _ca, updatedAt: _ua,
      game: _g, teams: _t, registrations: _r, matches: _m, invites: _i, _count,
      invitees, // optional list of usernames/emails to seed invites
      ...rest
    } = data
    const now = new Date().toISOString()
    const { data: tournament, error } = await supabase.from('Tournament').insert({
      ...rest,
      id: crypto.randomUUID(),
      gameId: game.id,
      createdById: user.userId,
      mapPool: data.mapPool || [],
      sponsorLogos: data.sponsorLogos || [],
      createdAt: now,
      updatedAt: now
    }).select('*, game:Game(*)').single()
    if (error) throw error

    // Seed invites if invite-only and a list was provided
    if (tournament.inviteOnly && Array.isArray(invitees) && invitees.length > 0) {
      const rows = []
      for (const raw of invitees) {
        const value = String(raw || '').trim()
        if (!value) continue
        const isEmail = value.includes('@')
        const lookup = isEmail
          ? supabase.from('User').select('id').ilike('email', value).maybeSingle()
          : supabase.from('User').select('id').ilike('username', value).maybeSingle()
        const { data: targetUser } = await lookup
        rows.push({
          id: crypto.randomUUID(),
          tournamentId: tournament.id,
          email: isEmail ? value.toLowerCase() : null,
          username: isEmail ? null : value,
          userId: targetUser?.id || null,
          status: 'PENDING',
          invitedById: user.userId,
          createdAt: now
        })
      }
      if (rows.length > 0) {
        await supabase.from('TournamentInvite').insert(rows)
      }
    }

    return NextResponse.json(tournament, { status: 201 })
  } catch (error) {
    if (error.message === 'Forbidden') return NextResponse.json({ error: 'ไม่มีสิทธิ์' }, { status: 403 })
    console.error('Create tournament error:', error)
    return NextResponse.json({ error: 'สร้างทัวร์ไม่สำเร็จ' }, { status: 500 })
  }
}
