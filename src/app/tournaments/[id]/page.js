'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { SkeletonBlock, SkeletonLine } from '@/components/Skeleton'

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

export default function TournamentDetailPage() {
  const { id } = useParams()
  const [tournament, setTournament] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/tournaments/${id}`)
      .then(r => r.json())
      .then(setTournament)
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <main className="min-h-screen">
        <Navbar />
        <SkeletonBlock className="h-48 md:h-64 w-full rounded-none" />
        <div className="max-w-5xl mx-auto px-4 py-8 space-y-4">
          <SkeletonLine className="h-8 w-2/3" />
          <SkeletonLine className="h-4 w-1/3" />
          <SkeletonBlock className="h-48 mt-8" />
        </div>
      </main>
    )
  }

  if (!tournament || tournament.error) {
    return (
      <main className="min-h-screen">
        <Navbar />
        <div className="flex flex-col items-center justify-center gap-4 py-32">
          <p className="text-gray-500">ไม่พบทัวร์นาเมนต์</p>
          <Link href="/tournaments" className="btn-primary">กลับหน้ารายการ</Link>
        </div>
      </main>
    )
  }

  const s = STATUS_LABEL[tournament.status] || { label: tournament.status, cls: 'badge-closed' }
  const totalParticipants = tournament._count?.teams ?? tournament._count?.registrations ?? 0

  const matchesByRound = (tournament.matches || []).reduce((acc, m) => {
    const key = `${m.bracket}-${m.round}`
    acc[key] = acc[key] || { bracket: m.bracket, round: m.round, items: [] }
    acc[key].items.push(m)
    return acc
  }, {})
  const roundGroups = Object.values(matchesByRound).sort((a, b) =>
    a.bracket === b.bracket ? a.round - b.round : a.bracket.localeCompare(b.bracket)
  )

  return (
    <main className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Banner */}
      {tournament.banner ? (
        <div className="h-48 md:h-64 bg-gray-200 overflow-hidden">
          <img src={tournament.banner} alt={tournament.name} className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className="h-48 md:h-64 bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 flex items-center justify-center">
          <span className="text-8xl drop-shadow-lg">{tournament.game?.icon || '🎮'}</span>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex flex-wrap items-start gap-3 mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap mb-1">
              <h1 className="font-head text-3xl font-bold text-gray-900">{tournament.name}</h1>
              <span className={`badge ${s.cls}`}>{s.label}</span>
            </div>
            <p className="text-gray-500">{tournament.game?.icon} {tournament.game?.name} · {FORMAT_LABEL[tournament.format] || tournament.format}</p>
          </div>
          <Link href="/tournaments" className="btn-secondary text-sm shrink-0">← ดูทั้งหมด</Link>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'ผู้เข้าแข่ง', value: `${totalParticipants}/${tournament.maxParticipants}` },
            { label: 'Format', value: FORMAT_LABEL[tournament.format] || tournament.format },
            { label: 'รางวัลที่ 1', value: tournament.prizeFirst > 0 ? `฿${tournament.prizeFirst.toLocaleString()}` : '-' },
            { label: 'วันแข่งขัน', value: tournament.startsAt ? new Date(tournament.startsAt).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }) : '-' },
          ].map((stat, i) => (
            <div key={i} className="card p-4 text-center">
              <div className="font-head font-bold text-lg text-gray-900">{stat.value}</div>
              <div className="text-xs text-gray-500 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">

            {/* Bracket — แสดงขึ้นมาก่อนเลย */}
            {roundGroups.length > 0 ? (
              <div className="card p-6">
                <h2 className="font-head font-bold text-lg mb-4">🏆 Bracket / ผลการแข่งขัน</h2>
                <div className="space-y-6">
                  {roundGroups.map(group => (
                    <div key={`${group.bracket}-${group.round}`}>
                      <h3 className="text-xs font-bold text-gray-400 mb-3 uppercase tracking-widest">
                        {group.bracket === 'GRAND_FINAL' ? '🏆 Grand Final' :
                          group.bracket === 'LOWER' ? `Lower Bracket · รอบ ${group.round}` :
                          `รอบที่ ${group.round}`}
                      </h3>
                      <div className="grid sm:grid-cols-2 gap-3">
                        {group.items.map(m => {
                          const aWin = m.winnerId && m.winnerId === m.participantA?.id
                          const bWin = m.winnerId && m.winnerId === m.participantB?.id
                          const finished = m.status === 'FINISHED'
                          return (
                            <div key={m.id} className="border border-gray-200 rounded-xl overflow-hidden shadow-sm text-sm">
                              <div className={`flex items-center justify-between px-4 py-2.5 ${aWin ? 'bg-emerald-50' : 'bg-white'}`}>
                                <span className={`font-semibold ${aWin ? 'text-emerald-700' : 'text-gray-700'}`}>
                                  {m.participantA?.name || <span className="text-gray-400 italic">TBD</span>}
                                </span>
                                {finished && (
                                  <span className={`font-bold text-base ${aWin ? 'text-emerald-600' : 'text-gray-400'}`}>{m.scoreA}</span>
                                )}
                              </div>
                              <div className="border-t border-gray-200" />
                              <div className={`flex items-center justify-between px-4 py-2.5 ${bWin ? 'bg-emerald-50' : 'bg-white'}`}>
                                <span className={`font-semibold ${bWin ? 'text-emerald-700' : 'text-gray-700'}`}>
                                  {m.participantB?.name || <span className="text-gray-400 italic">TBD</span>}
                                </span>
                                {finished && (
                                  <span className={`font-bold text-base ${bWin ? 'text-emerald-600' : 'text-gray-400'}`}>{m.scoreB}</span>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              tournament.status === 'LIVE' || tournament.status === 'CLOSED' ? (
                <div className="card p-8 text-center text-gray-400">
                  <div className="text-4xl mb-2">⏳</div>
                  <p>ยังไม่มี bracket — กำลังรอสร้าง</p>
                </div>
              ) : null
            )}

            {/* Teams list */}
            {tournament.teams?.length > 0 && (
              <div className="card p-6">
                <h2 className="font-head font-bold text-lg mb-4">👥 รายชื่อทีม ({tournament.teams.length}/{tournament.maxParticipants})</h2>
                <div className="grid sm:grid-cols-2 gap-2">
                  {tournament.teams.map((t, i) => (
                    <div key={t.id} className="flex items-center gap-3 py-2 px-3 rounded-lg bg-gray-50">
                      <span className="text-xs font-bold text-gray-400 w-5 text-right">{i + 1}</span>
                      <span className="font-semibold text-gray-800 text-sm">{t.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tournament.description && (
              <div className="card p-6">
                <h2 className="font-head font-bold text-lg mb-3">รายละเอียด</h2>
                <p className="text-gray-600 whitespace-pre-wrap text-sm">{tournament.description}</p>
              </div>
            )}

            {tournament.rules && (
              <div className="card p-6">
                <h2 className="font-head font-bold text-lg mb-3">📋 กติกา</h2>
                <pre className="text-gray-600 text-sm whitespace-pre-wrap font-sans">{tournament.rules}</pre>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="card p-5">
              <h3 className="font-head font-bold mb-3">📅 กำหนดการ</h3>
              <div className="space-y-2 text-sm">
                {tournament.regOpenAt && <div><span className="text-gray-500">เปิดรับสมัคร:</span> {new Date(tournament.regOpenAt).toLocaleDateString('th-TH')}</div>}
                {tournament.regCloseAt && <div><span className="text-gray-500">ปิดรับสมัคร:</span> {new Date(tournament.regCloseAt).toLocaleDateString('th-TH')}</div>}
                {tournament.startsAt && <div><span className="text-gray-500">วันแข่ง:</span> {new Date(tournament.startsAt).toLocaleDateString('th-TH')}</div>}
                {!tournament.regOpenAt && !tournament.regCloseAt && !tournament.startsAt && (
                  <div className="text-gray-400 text-xs">ยังไม่กำหนด</div>
                )}
              </div>
            </div>

            {tournament.prizeFirst > 0 && (
              <div className="card p-5">
                <h3 className="font-head font-bold mb-3">🏆 เงินรางวัล</h3>
                <div className="space-y-1 text-sm">
                  {tournament.prizeFirst > 0 && <div className="flex justify-between"><span className="text-gray-500">🥇 อันดับ 1</span><span className="font-bold text-amber-600">฿{tournament.prizeFirst.toLocaleString()}</span></div>}
                  {tournament.prizeSecond > 0 && <div className="flex justify-between"><span className="text-gray-500">🥈 อันดับ 2</span><span className="font-semibold">฿{tournament.prizeSecond.toLocaleString()}</span></div>}
                  {tournament.prizeThird > 0 && <div className="flex justify-between"><span className="text-gray-500">🥉 อันดับ 3</span><span className="font-semibold">฿{tournament.prizeThird.toLocaleString()}</span></div>}
                  {tournament.prizeMVP > 0 && <div className="flex justify-between"><span className="text-gray-500">⭐ MVP</span><span className="font-semibold">฿{tournament.prizeMVP.toLocaleString()}</span></div>}
                </div>
              </div>
            )}

            {(tournament.discordLink || tournament.streamLink || tournament.lineLink) && (
              <div className="card p-5">
                <h3 className="font-head font-bold mb-3">🔗 ลิงก์</h3>
                <div className="space-y-2">
                  {tournament.discordLink && <a href={tournament.discordLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-indigo-600 hover:underline"><span>💬</span>Discord Server</a>}
                  {tournament.lineLink && <a href={tournament.lineLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-green-600 hover:underline"><span>💬</span>LINE Group</a>}
                  {tournament.streamLink && <a href={tournament.streamLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-red-600 hover:underline"><span>📺</span>ถ่ายทอดสด</a>}
                </div>
              </div>
            )}

            {tournament.mapPool?.length > 0 && (
              <div className="card p-5">
                <h3 className="font-head font-bold mb-3">🗺 Map Pool</h3>
                <div className="flex flex-wrap gap-2">
                  {tournament.mapPool.map(m => (
                    <span key={m} className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full font-medium">{m}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
