import { NextResponse } from 'next/server'
import supabase from '@/lib/supabase'
import { requireAdmin } from '@/lib/auth'

export async function GET(request, { params }) {
  try {
    await requireAdmin()
    const { id } = await params
    const { data: invites, error } = await supabase
      .from('TournamentInvite')
      .select('*, user:User(id, username, displayName, email)')
      .eq('tournamentId', id)
      .order('createdAt', { ascending: false })
    if (error) throw error
    return NextResponse.json(invites || [])
  } catch (error) {
    if (error.message === 'Forbidden') return NextResponse.json({ error: 'ไม่มีสิทธิ์' }, { status: 403 })
    console.error('List invites error:', error)
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}

export async function POST(request, { params }) {
  try {
    const admin = await requireAdmin()
    const { id } = await params
    const body = await request.json()
    const targets = Array.isArray(body.invitees) ? body.invitees : []

    if (targets.length === 0) {
      return NextResponse.json({ error: 'กรุณาระบุอย่างน้อย 1 คน' }, { status: 400 })
    }

    const { data: tournament } = await supabase.from('Tournament').select('id').eq('id', id).maybeSingle()
    if (!tournament) return NextResponse.json({ error: 'ไม่พบทัวร์นาเมนต์' }, { status: 404 })

    const now = new Date().toISOString()
    const rows = []
    const errors = []
    for (const raw of targets) {
      const value = String(raw || '').trim()
      if (!value) continue
      const isEmail = value.includes('@')
      const filter = isEmail
        ? { email: value.toLowerCase(), username: null }
        : { email: null, username: value }
      // Skip duplicates already invited
      const dupQuery = supabase.from('TournamentInvite').select('id').eq('tournamentId', id)
      const { data: existing } = isEmail
        ? await dupQuery.ilike('email', value).maybeSingle()
        : await dupQuery.ilike('username', value).maybeSingle()
      if (existing) {
        errors.push(`${value} ถูกเชิญแล้ว`)
        continue
      }
      // Try resolve userId immediately if user exists
      const lookup = isEmail
        ? supabase.from('User').select('id').ilike('email', value).maybeSingle()
        : supabase.from('User').select('id').ilike('username', value).maybeSingle()
      const { data: targetUser } = await lookup

      rows.push({
        id: crypto.randomUUID(),
        tournamentId: id,
        email: isEmail ? value.toLowerCase() : null,
        username: isEmail ? null : value,
        userId: targetUser?.id || null,
        status: 'PENDING',
        invitedById: admin.userId,
        createdAt: now
      })
    }

    if (rows.length === 0) {
      return NextResponse.json({ error: errors[0] || 'ไม่มีรายชื่อให้เชิญ' }, { status: 400 })
    }

    const { data: created, error } = await supabase
      .from('TournamentInvite')
      .insert(rows)
      .select('*')
    if (error) throw error

    return NextResponse.json({ created, skipped: errors }, { status: 201 })
  } catch (error) {
    if (error.message === 'Forbidden') return NextResponse.json({ error: 'ไม่มีสิทธิ์' }, { status: 403 })
    console.error('Create invites error:', error)
    return NextResponse.json({ error: 'สร้างคำเชิญไม่สำเร็จ' }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    await requireAdmin()
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const inviteId = searchParams.get('inviteId')
    if (!inviteId) return NextResponse.json({ error: 'ระบุ inviteId' }, { status: 400 })

    const { error } = await supabase
      .from('TournamentInvite')
      .delete()
      .eq('id', inviteId)
      .eq('tournamentId', id)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error) {
    if (error.message === 'Forbidden') return NextResponse.json({ error: 'ไม่มีสิทธิ์' }, { status: 403 })
    console.error('Delete invite error:', error)
    return NextResponse.json({ error: 'ลบคำเชิญไม่สำเร็จ' }, { status: 500 })
  }
}
