import { NextResponse } from 'next/server'
import supabase from '@/lib/supabase'
import { hashPassword, createToken } from '@/lib/auth'

export async function POST(request) {
  try {
    const body = await request.json()
    const email = (body.email || '').trim().toLowerCase()
    const username = (body.username || '').trim()
    const password = body.password || ''
    const { displayName, phone } = body

    if (!email || !username || !password) return NextResponse.json({ error: 'กรุณากรอกข้อมูลให้ครบ' }, { status: 400 })
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: 'รูปแบบ email ไม่ถูกต้อง' }, { status: 400 })
    if (password.length < 8) return NextResponse.json({ error: 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร' }, { status: 400 })
    if (!/\d/.test(password)) return NextResponse.json({ error: 'รหัสผ่านต้องมีตัวเลขอย่างน้อย 1 ตัว' }, { status: 400 })

    const [{ data: emailCheck }, { data: usernameCheck }] = await Promise.all([
      supabase.from('User').select('id').ilike('email', email).maybeSingle(),
      supabase.from('User').select('id').ilike('username', username).maybeSingle()
    ])
    if (emailCheck || usernameCheck) return NextResponse.json({ error: 'Email หรือ Username ถูกใช้แล้ว' }, { status: 409 })

    const passwordHash = await hashPassword(password)
    const now = new Date().toISOString()
    const { data: user, error } = await supabase.from('User').insert({
      id: crypto.randomUUID(),
      email, username, passwordHash,
      displayName: displayName || username,
      phone: phone || null,
      role: 'PLAYER',
      createdAt: now,
      updatedAt: now
    }).select().single()
    if (error) throw error

    const token = createToken(user)
    const response = NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email, username: user.username, role: user.role }
    })
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7
    })
    return response
  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}
