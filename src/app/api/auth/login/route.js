import { NextResponse } from 'next/server'
import supabase from '@/lib/supabase'
import { verifyPassword, createToken } from '@/lib/auth'

export async function POST(request) {
  try {
    const body = await request.json()
    const email = (body.email || '').trim().toLowerCase()
    const password = body.password || ''
    if (!email || !password) return NextResponse.json({ error: 'กรุณากรอก email และ password' }, { status: 400 })

    const { data: user, error: dbError } = await supabase.from('User').select('*').ilike('email', email).maybeSingle()
    if (dbError) {
      console.error('Login DB error:', dbError)
      return NextResponse.json({ error: 'ไม่สามารถเชื่อมต่อฐานข้อมูลได้ กรุณาติดต่อ admin' }, { status: 500 })
    }
    if (!user) return NextResponse.json({ error: 'Email หรือ Password ไม่ถูกต้อง' }, { status: 401 })

    const valid = await verifyPassword(password, user.passwordHash)
    if (!valid) return NextResponse.json({ error: 'Email หรือ Password ไม่ถูกต้อง' }, { status: 401 })

    const token = createToken(user)
    const response = NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email, username: user.username, role: user.role, displayName: user.displayName }
    })
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7
    })
    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}
