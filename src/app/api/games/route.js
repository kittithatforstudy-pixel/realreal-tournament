import { NextResponse } from 'next/server'
import supabase from '@/lib/supabase'
import { requireAdmin } from '@/lib/auth'

export async function GET() {
  try {
    const { data: games, error } = await supabase.from('Game').select('*').eq('isActive', true).order('name')
    if (error) throw error
    return NextResponse.json(games)
  } catch (error) {
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
    return NextResponse.json({ error: 'เพิ่มเกมไม่สำเร็จ' }, { status: 500 })
  }
}
