import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { hashPassword, createToken } from '@/lib/auth'

export async function POST(request) {
  try {
    const { email, username, password, displayName, phone } = await request.json()

    if (!email || !username || !password) {
      return NextResponse.json({ error: 'กรุณากรอกข้อมูลให้ครบ' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' }, { status: 400 })
    }

    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] }
    })

    if (existing) {
      return NextResponse.json({ error: 'Email หรือ Username ถูกใช้แล้ว' }, { status: 409 })
    }

    const passwordHash = await hashPassword(password)

    const user = await prisma.user.create({
      data: { email, username, passwordHash, displayName: displayName || username, phone }
    })

    const token = createToken(user)

    const response = NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email, username: user.username, role: user.role }
    })

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    })

    return response
  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}
