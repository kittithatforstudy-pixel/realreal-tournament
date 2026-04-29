'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const REG_STATUS = {
  PENDING: { label: 'รอยืนยัน', cls: 'bg-yellow-100 text-yellow-700' },
  CONFIRMED: { label: 'ยืนยันแล้ว', cls: 'bg-green-100 text-green-700' },
  CANCELLED: { label: 'ยกเลิก', cls: 'bg-gray-100 text-gray-600' },
  DQ: { label: 'ถูก DQ', cls: 'bg-red-100 text-red-700' },
}

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Try to get current user from a lightweight profile endpoint
    // Since there's no /api/me yet, we show a login prompt
    setLoading(false)
  }, [])

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {})
    router.push('/')
    router.refresh()
  }

  return (
    <main className="min-h-screen">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-2xl">⚡</span>
              <span className="font-head font-bold text-xl text-gray-900">RealReal Tournament</span>
            </Link>
            <div className="flex items-center gap-3">
              <Link href="/tournaments" className="text-gray-600 hover:text-blue-500 text-sm">ทัวร์นาเมนต์</Link>
              <Link href="/auth/login" className="btn-secondary text-sm">เข้าสู่ระบบ</Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="card p-8 text-center">
          <div className="text-6xl mb-4">👤</div>
          <h1 className="font-head text-2xl font-bold text-gray-900 mb-2">โปรไฟล์</h1>
          <p className="text-gray-500 mb-6">กรุณาเข้าสู่ระบบเพื่อดูโปรไฟล์และประวัติการสมัคร</p>
          <div className="flex justify-center gap-3">
            <Link href="/auth/login" className="btn-primary px-8">เข้าสู่ระบบ</Link>
            <Link href="/auth/register" className="btn-secondary px-8">สมัครสมาชิก</Link>
          </div>
        </div>

        <div className="mt-6 card p-6">
          <h2 className="font-head font-bold text-lg mb-4">ข้อมูลที่จะแสดงเมื่อเข้าสู่ระบบ</h2>
          <ul className="space-y-2 text-sm text-gray-500">
            <li>• ชื่อผู้ใช้ / Email / เบอร์โทร</li>
            <li>• ประวัติการสมัครทัวร์นาเมนต์</li>
            <li>• สถานะการชำระเงิน</li>
            <li>• ทีมที่เข้าร่วม</li>
          </ul>
        </div>
      </div>
    </main>
  )
}
