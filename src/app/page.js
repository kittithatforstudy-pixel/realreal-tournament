'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { SkeletonGrid } from '@/components/Skeleton'

const STATUS_LABEL = {
  OPEN: { label: 'เปิดรับสมัคร', cls: 'badge-open' },
  CLOSED: { label: 'ปิดรับสมัคร', cls: 'badge-closed' },
  LIVE: { label: 'กำลังแข่ง', cls: 'badge-live' },
  FINISHED: { label: 'จบแล้ว', cls: 'badge-closed' },
  CANCELLED: { label: 'ยกเลิก', cls: 'badge-closed' },
}

const FORMAT_LABEL = {
  SINGLE_ELIM: 'Single Elimination',
  DOUBLE_ELIM: 'Double Elimination',
  ROUND_ROBIN: 'Round Robin',
  SWISS: 'Swiss',
  BATTLE_ROYALE: 'Battle Royale',
  GROUP_PLAYOFF: 'Group + Playoff',
}

export default function HomePage() {
  const [tournaments, setTournaments] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState({ status: '', gameId: '', q: '' })
  const [games, setGames] = useState([])

  useEffect(() => {
    fetch('/api/games').then(r => r.json()).then(d => setGames(Array.isArray(d) ? d : [])).catch(() => {})
  }, [])

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (filter.status) params.set('status', filter.status)
    if (filter.gameId) params.set('gameId', filter.gameId)
    fetch('/api/tournaments?' + params.toString())
      .then(r => r.json())
      .then(d => { setTournaments(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [filter.status, filter.gameId])

  const visible = useMemo(() => {
    const q = filter.q.trim().toLowerCase()
    if (!q) return tournaments
    return tournaments.filter(t =>
      t.name?.toLowerCase().includes(q) ||
      t.game?.name?.toLowerCase().includes(q)
    )
  }, [tournaments, filter.q])

  const featured = visible.slice(0, 9)
  const openCount = tournaments.filter(t => t.status === 'OPEN').length
  const liveCount = tournaments.filter(t => t.status === 'LIVE').length

  return (
    <main className="min-h-screen">
      <Navbar />

      {/* Hero with search */}
      <section className="relative overflow-hidden py-14 lg:py-20 border-b border-cream-200">
        <div className="absolute inset-0 bg-gradient-to-br from-cream-100 via-cream-50 to-amber-50" />
        <div className="absolute inset-0 opacity-40" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 30h60M30 0v60' stroke='%23e8dcb8' stroke-width='0.5'/%3E%3C/svg%3E")`
        }} />
        <div className="relative max-w-5xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-white/70 backdrop-blur border border-cream-200 rounded-full px-4 py-1.5 text-xs font-semibold text-amber-700 mb-5">
            ⚡ ทัวร์นาเมนต์เกม จัดประจำโดย RealReal
          </div>
          <h1 className="font-head text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 leading-tight">
            ทัวร์นาเมนต์เกม<br />
            <span className="bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">ที่จัดจริง · จัดประจำ</span>
          </h1>
          <p className="text-gray-600 text-base md:text-lg mb-8 max-w-2xl mx-auto">
            ติดตาม bracket ผลการแข่งขัน และความเคลื่อนไหวของทุกทัวร์นาเมนต์ได้ที่นี่
          </p>

          {/* Search bar */}
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl shadow-md border border-cream-200 p-2 flex flex-col sm:flex-row gap-2">
              <div className="flex-1 flex items-center gap-2 px-3">
                <span className="text-xl">🔍</span>
                <input
                  type="search"
                  className="w-full bg-transparent border-0 focus:outline-none focus:ring-0 text-gray-900 placeholder-gray-400 py-2"
                  placeholder="ค้นชื่อทัวร์ หรือ ชื่อเกม..."
                  value={filter.q}
                  onChange={e => setFilter(f => ({ ...f, q: e.target.value }))}
                />
              </div>
              <Link href="/tournaments" className="btn-primary px-6 whitespace-nowrap">ดูทัวร์ทั้งหมด</Link>
            </div>

            {/* Stats */}
            <div className="mt-6 flex flex-wrap justify-center gap-4 sm:gap-8 text-sm">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-gray-600">เปิดรับสมัคร</span>
                <span className="font-bold text-gray-900">{openCount}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-gray-600">กำลังแข่ง</span>
                <span className="font-bold text-gray-900">{liveCount}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span className="text-gray-600">ทั้งหมด</span>
                <span className="font-bold text-gray-900">{tournaments.length}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tournaments + filters */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
          <div>
            <h2 className="font-head text-2xl md:text-3xl font-bold text-gray-900">🏆 ทัวร์นาเมนต์</h2>
            <p className="text-gray-500 text-sm mt-1">เลือกทัวร์ที่คุณสนใจและสมัครได้เลย</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              className="input sm:w-auto"
              value={filter.status}
              onChange={e => setFilter(f => ({ ...f, status: e.target.value }))}
            >
              <option value="">ทุกสถานะ</option>
              <option value="OPEN">เปิดรับสมัคร</option>
              <option value="LIVE">กำลังแข่ง</option>
              <option value="FINISHED">จบแล้ว</option>
            </select>
            <select
              className="input sm:w-auto"
              value={filter.gameId}
              onChange={e => setFilter(f => ({ ...f, gameId: e.target.value }))}
            >
              <option value="">ทุกเกม</option>
              {games.map(g => <option key={g.id} value={g.id}>{g.icon} {g.name}</option>)}
            </select>
          </div>
        </div>

        {!loading && (
          <p className="text-sm text-gray-500 mb-4">พบ {visible.length} ทัวร์นาเมนต์</p>
        )}

        {loading ? (
          <SkeletonGrid count={6} />
        ) : featured.length === 0 ? (
          <div className="card text-center py-20">
            <div className="text-6xl mb-4">🏆</div>
            <p className="text-gray-500 text-lg mb-4">
              {filter.q ? 'ไม่พบทัวร์ที่ตรงกับคำค้น' : 'ยังไม่มีทัวร์นาเมนต์'}
            </p>
            {filter.q && (
              <button
                onClick={() => setFilter(f => ({ ...f, q: '' }))}
                className="btn-secondary"
              >
                ล้างคำค้น
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featured.map(t => {
                const s = STATUS_LABEL[t.status] || { label: t.status, cls: 'badge-closed' }
                const startDate = t.startsAt ? new Date(t.startsAt).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }) : null
                return (
                  <Link key={t.id} href={`/tournaments/${t.id}`} className="card hover:shadow-md hover:-translate-y-0.5 transition-all overflow-hidden group">
                    {t.banner ? (
                      <div className="h-32 bg-cream-100 overflow-hidden">
                        <img src={t.banner} alt={t.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      </div>
                    ) : (
                      <div className="h-32 bg-gradient-to-br from-amber-300 via-orange-400 to-rose-400 flex items-center justify-center">
                        <span className="text-5xl drop-shadow-sm">{t.game?.icon || '🎮'}</span>
                      </div>
                    )}
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-head font-bold text-gray-900 leading-tight">{t.name}</h3>
                        <span className={`badge ${s.cls} shrink-0`}>{s.label}</span>
                      </div>
                      <p className="text-sm text-gray-500 mb-3">{t.game?.name} · {FORMAT_LABEL[t.format] || t.format}</p>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">
                          {t._count?.teams ?? t._count?.registrations ?? 0} / {t.maxParticipants} ทีม
                        </span>
                        <span className="font-semibold text-amber-700">
                          {t.entryFee === 0 ? 'ฟรี' : `฿${t.entryFee.toLocaleString()}`}
                        </span>
                      </div>
                      {startDate && (
                        <div className="mt-2 text-xs text-gray-500">📅 แข่ง: {startDate}</div>
                      )}
                      {t.prizeFirst > 0 && (
                        <div className="mt-1 text-xs text-amber-600 font-semibold">
                          🏆 รางวัลที่ 1: ฿{t.prizeFirst.toLocaleString()}
                        </div>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
            {visible.length > featured.length && (
              <div className="text-center mt-8">
                <Link href="/tournaments" className="btn-secondary">ดูเพิ่มเติม ({visible.length - featured.length})</Link>
              </div>
            )}
          </>
        )}
      </section>

      {/* Features */}
      <section className="py-14 bg-white border-t border-cream-200">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="font-head text-2xl md:text-3xl font-bold text-center mb-2">ติดตามได้ครบทุกอย่าง</h2>
          <p className="text-gray-500 text-center mb-10">ดูผลการแข่งขัน bracket และข้อมูลทัวร์แบบ real-time</p>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: '🎮', title: 'หลายเกมหลายแนว', desc: 'FPS, MOBA, BR, ไฟท์ติ้ง, กีฬา — ครอบคลุมทุกประเภทเกม' },
              { icon: '📊', title: 'Bracket Real-time', desc: 'ติดตามสาย ดูคู่แข่ง ผลแมตช์อัพเดทตลอดการแข่ง' },
              { icon: '🤖', title: 'แจ้งเตือนผ่าน Discord', desc: 'อัพเดทตารางแข่ง ผลแมตช์ และประกาศต่าง ๆ ทาง Discord อัตโนมัติ' },
            ].map((f, i) => (
              <div key={i} className="card p-6 hover:shadow-md transition-shadow">
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="font-head font-bold text-lg mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="bg-stone-800 text-stone-300 py-8">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-sm">⚡ RealReal Tournament — ทัวร์นาเมนต์เกมที่จัดจริง</p>
        </div>
      </footer>
    </main>
  )
}
