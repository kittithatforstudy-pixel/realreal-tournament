import { NextResponse } from 'next/server'
import supabase from '@/lib/supabase'
import { requireAdmin } from '@/lib/auth'

export async function GET() {
  try {
    const { data: games, error } = await supabase
      .from('Game')
      .select('*, tournaments:Tournament(id)')
      .eq('isActive', true)
      .order('name')
    if (error) throw error
    const result = (games || []).map(g => {
      const { tournaments = [], ...rest } = g
      return { ...rest, _count: { tournaments: tournaments.length } }
    })
    return NextResponse.json(result)
  } catch (error) {
    console.error('Get games error:', error)
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    await requireAdmin()
    const data = await request.json()
    const { data: game, error } = await supabase.from('Game').insert({
      id: crypto.randomUUID(),
      ...data,
      createdAt: new Date().toISOString()
    }).select().single()
    if (error) throw error
    return NextResponse.json(game, { status: 201 })
  } catch (error) {
    if (error.message === 'Forbidden') return NextResponse.json({ error: 'ไม่มีสิทธิ์' }, { status: 403 })
    console.error('Create game error:', error)
    return NextResponse.json({ error: 'เพิ่มเกมไม่สำเร็จ' }, { status: 500 })
  }
}
