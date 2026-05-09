'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/Toast'

export default function LoginPage() {
  const router = useRouter()
  const toast = useToast()
  const [form, setForm] = useState({ email: '', password: '' })
  const [platformLinks, setPlatformLinks] = useState({ discordServerLink: null, registrationFormUrl: null })

  useEffect(() => {
    fetch('/api/platform-settings')
      .then(r => r.ok ? r.json() : {})
      .then(d => setPlatformLinks(d))
      .catch(() => {})
  }, [])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'เกิดข้อผิดพลาด')
        return
      }

      toast.show('เข้าสู่ระบบสำเร็จ', 'success')
      router.push('/')
      router.refresh()
    } catch (err) {
      setError('เกิดข้อผิดพลาด: ' + (err?.message || 'กรุณาลองใหม่'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-cream-100 via-white to-amber-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <span className="text-3xl">⚡</span>
            <span className="font-head font-bold text-2xl text-gray-900">RealReal Tournament</span>
          </Link>
        </div>

        <div className="card p-8">
          <h1 className="font-head text-2xl font-bold text-gray-900 mb-6">เข้าสู่ระบบ</h1>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-5 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email</label>
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
              <label className="label">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input pr-20"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  required
                  autoComplete="current-password"
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

            <button
              type="submit"
              className="btn-primary w-full py-3 text-base"
              disabled={loading}
            >
              {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
            </button>
          </form>

          {(platformLinks.discordServerLink || platformLinks.registrationFormUrl) && (
            <div className="mt-6 pt-6 border-t border-gray-100 space-y-2">
              <p className="text-xs text-gray-400 text-center mb-3">สนใจเข้าร่วมทัวร์?</p>
              {platformLinks.discordServerLink && (
                <a
                  href={platformLinks.discordServerLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-700 text-sm font-semibold hover:bg-indigo-100 transition-colors"
                >
                  💬 เข้า Discord Server
                </a>
              )}
              {platformLinks.registrationFormUrl && (
                <a
                  href={platformLinks.registrationFormUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-lg border border-amber-200 bg-amber-50 text-amber-700 text-sm font-semibold hover:bg-amber-100 transition-colors"
                >
                  📋 ฟอร์มสมัครทัวร์
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
