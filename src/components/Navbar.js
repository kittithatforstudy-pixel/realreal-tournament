'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'

export default function Navbar({ variant = 'default' }) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch('/api/me')
      .then(r => (r.status === 401 ? null : r.json()))
      .then(d => {
        if (cancelled) return
        setUser(d?.user || null)
        setLoading(false)
      })
      .catch(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [pathname])

  useEffect(() => { setMenuOpen(false) }, [pathname])

  async function handleLogout() {
    try { await fetch('/api/auth/logout', { method: 'POST' }) } catch {}
    setUser(null)
    setMenuOpen(false)
    router.push('/')
    router.refresh()
  }

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN'
  const dark = variant === 'admin'
  const navClasses = dark
    ? 'bg-gray-900 text-white sticky top-0 z-40'
    : 'bg-cream-50/90 backdrop-blur border-b border-cream-200 sticky top-0 z-40'
  const linkClasses = dark
    ? 'text-gray-300 hover:text-white transition-colors'
    : 'text-gray-700 hover:text-amber-600 transition-colors'

  return (
    <nav className={navClasses}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">⚡</span>
            <span className={`font-head font-bold text-xl ${dark ? 'text-white' : 'text-gray-900'}`}>
              RealReal {dark ? 'Admin' : 'Tournament'}
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <Link href="/tournaments" className={linkClasses}>ทัวร์นาเมนต์</Link>
            {user && <Link href="/profile" className={linkClasses}>โปรไฟล์</Link>}
            {isAdmin && <Link href="/admin" className={linkClasses}>Admin</Link>}
          </div>

          <div className="hidden md:flex items-center gap-3">
            {!loading && (user ? (
              <>
                <span className={`text-sm ${dark ? 'text-gray-300' : 'text-gray-600'}`}>@{user.username}</span>
                <button onClick={handleLogout} className="btn-secondary text-sm">ออกจากระบบ</button>
              </>
            ) : (
              <Link href="/auth/login" className="btn-secondary text-sm">เข้าสู่ระบบ Admin</Link>
            ))}
          </div>

          <button
            onClick={() => setMenuOpen(o => !o)}
            className={`md:hidden p-2 text-2xl leading-none ${dark ? 'text-white' : 'text-gray-700'}`}
            aria-label="เมนู"
          >
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>

        {menuOpen && (
          <div className={`md:hidden py-3 border-t space-y-1 ${dark ? 'border-gray-700' : 'border-gray-100'}`}>
            <Link href="/tournaments" className={`block px-2 py-2 rounded ${dark ? 'text-gray-200 hover:bg-gray-800' : 'text-gray-700 hover:bg-gray-50'}`}>ทัวร์นาเมนต์</Link>
            {user && <Link href="/profile" className={`block px-2 py-2 rounded ${dark ? 'text-gray-200 hover:bg-gray-800' : 'text-gray-700 hover:bg-gray-50'}`}>โปรไฟล์</Link>}
            {isAdmin && <Link href="/admin" className={`block px-2 py-2 rounded ${dark ? 'text-gray-200 hover:bg-gray-800' : 'text-gray-700 hover:bg-gray-50'}`}>Admin</Link>}
            <div className={`pt-2 mt-2 border-t ${dark ? 'border-gray-700' : 'border-gray-100'}`}>
              {!loading && (user ? (
                <button onClick={handleLogout} className={`w-full text-left px-2 py-2 rounded ${dark ? 'text-gray-200 hover:bg-gray-800' : 'text-gray-700 hover:bg-gray-50'}`}>
                  ออกจากระบบ (@{user.username})
                </button>
              ) : (
                <div className="px-2">
                  <Link href="/auth/login" className="btn-secondary text-sm w-full text-center">เข้าสู่ระบบ Admin</Link>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
