'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/Toast'

export default function RegisterPage() {
  const router = useRouter()
  const toast = useToast()
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
  const [showPassword, setShowPassword] = useState(false)

  const passwordRules = [
    { label: 'อย่างน้อย 8 ตัวอักษร', ok: form.password.length >= 8 },
    { label: 'มีตัวเลขอย่างน้อย 1 ตัว', ok: /\d/.test(form.password) },
    { label: 'รหัสผ่านตรงกัน', ok: form.password.length > 0 && form.password === form.confirmPassword }
  ]

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError('รูปแบบ email ไม่ถูกต้อง')
      return
    }
    if (form.password !== form.confirmPassword) {
      setError('รหัสผ่านไม่ตรงกัน')
      return
    }
    if (form.password.length < 8) {
      setError('รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร')
      return
    }
    if (!/\d/.test(form.password)) {
      setError('รหัสผ่านต้องมีตัวเลขอย่างน้อย 1 ตัว')
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

      toast.show('สมัครสมาชิกสำเร็จ ยินดีต้อนรับ!', 'success')
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
                autoComplete="email"
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
                minLength={3}
                autoComplete="username"
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
                autoComplete="tel"
              />
            </div>

            <div>
              <label className="label">Password <span className="text-red-500">*</span></label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input pr-20"
                  placeholder="อย่างน้อย 8 ตัวอักษร + ตัวเลข"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? 'ซ่อน' : 'แสดง'}
                </button>
              </div>
            </div>

            <div>
              <label className="label">ยืนยัน Password <span className="text-red-500">*</span></label>
              <input
                type={showPassword ? 'text' : 'password'}
                className="input"
                placeholder="••••••••"
                value={form.confirmPassword}
                onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
                required
                autoComplete="new-password"
              />
            </div>

            <ul className="text-xs space-y-1 -mt-1">
              {passwordRules.map((r, i) => (
                <li key={i} className={r.ok ? 'text-green-600' : 'text-gray-400'}>
                  {r.ok ? '✓' : '○'} {r.label}
                </li>
              ))}
            </ul>

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
