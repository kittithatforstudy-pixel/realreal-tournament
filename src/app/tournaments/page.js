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

export default function TournamentsPage() {
  const [tournaments, setTournaments] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState({ status: '', gameId: '', q: '' })
  const [games, setGames] = useState([])

  useEffect(() => {
    fetch('/api/games').then(r => r.json()).then(setGames).catch(() => {})
  }, [])

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (filter.status) params.set('status', filter.status)
    if (filter.gameId) params.set('gameId', filter.gameId)
    fetch('/api/tournaments?' + params.toString())
      .then(r => r.json())
      .then(data => { setTournaments(Array.isArray(data) ? data : []); setLoading(false) })
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

  return (
    <main className="min-h-screen">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex flex-col gap-4 mb-8">
          <h1 className="font-head text-3xl font-bold text-gray-900">ทัวร์นาเมนต์ทั้งหมด</h1>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="search"
              className="input flex-1"
              placeholder="🔍 ค้นชื่อทัวร์หรือชื่อเกม..."
              value={filter.q}
              onChange={e => setFilter(f => ({ ...f, q: e.target.value }))}
            />
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
          {!loading && (
            <p className="text-sm text-gray-500">พบ {visible.length} ทัวร์นาเมนต์</p>
          )}
        </div>

        {loading ? (
          <SkeletonGrid count={6} />
        ) : visible.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🏆</div>
            <p className="text-gray-500 text-lg">
              {filter.q ? 'ไม่พบทัวร์ที่ตรงกับคำค้น' : 'ยังไม่มีทัวร์นาเมนต์'}
            </p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {visible.map(t => {
              const s = STATUS_LABEL[t.status] || { label: t.status, cls: 'badge-closed' }
              const startDate = t.startsAt ? new Date(t.startsAt).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }) : null
              return (
                <Link key={t.id} href={`/tournaments/${t.id}`} className="card hover:shadow-md transition-shadow overflow-hidden group">
                  {t.banner ? (
                    <div className="h-32 bg-gray-100 overflow-hidden">
                      <img src={t.banner} alt={t.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    </div>
                  ) : (
                    <div className="h-32 bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                      <span className="text-5xl">{t.game?.icon || '🎮'}</span>
                    </div>
                  )}
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h2 className="font-head font-bold text-gray-900 leading-tight">{t.name}</h2>
                      <span className={`badge ${s.cls} shrink-0`}>{s.label}</span>
                    </div>
                    <p className="text-sm text-gray-500 mb-3">{t.game?.name} · {FORMAT_LABEL[t.format] || t.format}</p>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">
                        {t._count?.teams ?? t._count?.registrations ?? 0} / {t.maxParticipants} ทีม
                      </span>
                      <span className="font-semibold text-blue-600">
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
        )}
      </div>
    </main>
  )
}
