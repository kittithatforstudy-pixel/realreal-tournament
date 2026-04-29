import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { verifyPassword, createToken } from '@/lib/auth'

export async function POST(request) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'กรุณากรอก email และ password' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { email } })

    if (!user) {
      return NextResponse.json({ error: 'Email หรือ Password ไม่ถูกต้อง' }, { status: 401 })
    }

    const valid = await verifyPassword(password, user.passwordHash)

    if (!valid) {
      return NextResponse.json({ error: 'Email หรือ Password ไม่ถูกต้อง' }, { status: 401 })
    }

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
