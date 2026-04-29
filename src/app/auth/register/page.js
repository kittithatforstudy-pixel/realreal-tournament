'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    email: '',
    username: '',
    displayName: '',
    phone: '',
    password: '',
    confirmPassword: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (form.password !== form.confirmPassword) {
      setError('รหัสผ่านไม่ตรงกัน')
      return
    }

    if (form.password.length < 6) {
      setError('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email,
          username: form.username,
          displayName: form.displayName,
          phone: form.phone,
          password: form.password
        })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'เกิดข้อผิดพลาด')
        return
      }

      router.push('/')
      router.refresh()
    } catch {
      setError('เกิดข้อผิดพลาด กรุณาลองใหม่')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <span className="text-3xl">⚡</span>
            <span className="font-head font-bold text-2xl text-gray-900">RealReal Tournament</span>
          </Link>
        </div>

        <div className="card p-8">
          <h1 className="font-head text-2xl font-bold text-gray-900 mb-6">สมัครสมาชิก</h1>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-5 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email <span className="text-red-500">*</span></label>
              <input
                type="email"
                className="input"
                placeholder="your@email.com"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="label">Username <span className="text-red-500">*</span></label>
              <input
                type="text"
                className="input"
                placeholder="username"
                value={form.username}
                onChange={e => setForm({ ...form, username: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="label">ชื่อที่แสดง</label>
              <input
                type="text"
                className="input"
                placeholder="ชื่อ-นามสกุล หรือ Nickname"
                value={form.displayName}
                onChange={e => setForm({ ...form, displayName: e.target.value })}
              />
            </div>

            <div>
              <label className="label">เบอร์โทรศัพท์</label>
              <input
                type="tel"
                className="input"
                placeholder="08X-XXX-XXXX"
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
              />
            </div>

            <div>
              <label className="label">Password <span className="text-red-500">*</span></label>
              <input
                type="password"
                className="input"
                placeholder="อย่างน้อย 6 ตัวอักษร"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="label">ยืนยัน Password <span className="text-red-500">*</span></label>
              <input
                type="password"
                className="input"
                placeholder="••••••••"
                value={form.confirmPassword}
                onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
                required
              />
            </div>

            <button
              type="submit"
              className="btn-primary w-full py-3 text-base"
              disabled={loading}
            >
              {loading ? 'กำลังสมัคร...' : 'สมัครสมาชิก'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            มีบัญชีแล้ว?{' '}
            <Link href="/auth/login" className="text-blue-500 hover:text-blue-600 font-semibold">
              เข้าสู่ระบบ
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}
