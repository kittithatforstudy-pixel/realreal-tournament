import { NextResponse } from 'next/server'
import supabase from '@/lib/supabase'
import { requireAdmin } from '@/lib/auth'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const gameId = searchParams.get('gameId')
    const format = searchParams.get('format')

    let query = supabase.from('Tournament').select('*, game:Game(*)').order('createdAt', { ascending: false })
    if (status) query = query.eq('status', status)
    else query = query.neq('status', 'DRAFT')
    if (gameId) query = query.eq('gameId', gameId)
    if (format) query = query.eq('format', format)

    const { data: tournaments, error } = await query
    if (error) throw error
    return NextResponse.json((tournaments || []).map(t => ({ ...t, _count: { registrations: 0, teams: 0 } })))
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

    const { gameName: _, ...rest } = data
    const now = new Date().toISOString()
    const { data: tournament, error } = await supabase.from('Tournament').insert({
      id: crypto.randomUUID(),
      ...rest,
      gameId: game.id,
      createdById: user.userId,
      mapPool: data.mapPool || [],
      sponsorLogos: data.sponsorLogos || [],
      createdAt: now,
      updatedAt: now
    }).select('*, game:Game(*)').single()
    if (error) throw error

    return NextResponse.json(tournament, { status: 201 })
  } catch (error) {
    if (error.message === 'Forbidden') return NextResponse.json({ error: 'ไม่มีสิทธิ์' }, { status: 403 })
    console.error('Create tournament error:', error)
    return NextResponse.json({ error: 'สร้างทัวร์ไม่สำเร็จ' }, { status: 500 })
  }
}
