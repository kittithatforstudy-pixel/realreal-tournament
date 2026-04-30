'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { useToast } from '@/components/Toast'
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

const REG_STATUS_LABEL = {
  PENDING: { label: 'รอยืนยัน', cls: 'bg-yellow-100 text-yellow-700' },
  CONFIRMED: { label: 'ยืนยันแล้ว', cls: 'bg-green-100 text-green-700' },
  CANCELLED: { label: 'ยกเลิก', cls: 'bg-gray-100 text-gray-600' },
  DQ: { label: 'ถูก DQ', cls: 'bg-red-100 text-red-700' },
}

export default function TournamentDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const toast = useToast()
  const [tournament, setTournament] = useState(null)
  const [loading, setLoading] = useState(true)
  const [me, setMe] = useState(null)
  const [showRegister, setShowRegister] = useState(false)
  const [regForm, setRegForm] = useState({ teamName: '', slipUrl: '', channel: 'PROMPTPAY', note: '' })
  const [regLoading, setRegLoading] = useState(false)
  const [regError, setRegError] = useState('')

  function loadTournament() {
    return fetch(`/api/tournaments/${id}`).then(r => r.json()).then(setTournament)
  }

  useEffect(() => {
    loadTournament().finally(() => setLoading(false))
    fetch('/api/me').then(r => r.status === 401 ? null : r.json()).then(d => setMe(d || null)).catch(() => {})
  }, [id])

  const myRegistration = useMemo(() => {
    if (!me?.registrations) return null
    return me.registrations.find(r => r.tournament?.id === id) || null
  }, [me, id])

  async function handleRegister(e) {
    e.preventDefault()
    setRegError('')

    if (tournament.entryFee > 0 && !regForm.slipUrl) {
      setRegError('กรุณาแนบลิงก์สลิปการโอนเงิน')
      return
    }

    setRegLoading(true)
    try {
      const res = await fetch(`/api/tournaments/${id}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamName: regForm.teamName || undefined,
          slipUrl: regForm.slipUrl || undefined,
          channel: regForm.channel,
          note: regForm.note || undefined,
          amount: tournament.entryFee
        })
      })
      const data = await res.json()
      if (!res.ok) {
        if (res.status === 401) {
          toast.show('กรุณาเข้าสู่ระบบก่อน', 'error')
          router.push('/auth/login')
          return
        }
        setRegError(data.error || 'สมัครไม่สำเร็จ')
      } else {
        toast.show('สมัครสำเร็จ! รอ Admin approve สลิป', 'success')
        setShowRegister(false)
        setRegForm({ teamName: '', slipUrl: '', channel: 'PROMPTPAY', note: '' })
        await loadTournament()
        fetch('/api/me').then(r => r.status === 401 ? null : r.json()).then(d => setMe(d || null)).catch(() => {})
      }
    } catch {
      setRegError('เกิดข้อผิดพลาด')
    } finally {
      setRegLoading(false)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen">
        <Navbar />
        <SkeletonBlock className="h-48 md:h-64 w-full rounded-none" />
        <div className="max-w-5xl mx-auto px-4 py-8 space-y-4">
          <SkeletonLine className="h-8 w-2/3" />
          <SkeletonLine className="h-4 w-1/3" />
          <div className="grid md:grid-cols-3 gap-6 mt-8">
            <SkeletonBlock className="h-48 md:col-span-2" />
            <SkeletonBlock className="h-48" />
          </div>
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
    (a.bracket === b.bracket ? a.round - b.round : a.bracket.localeCompare(b.bracket))
  )

  return (
    <main className="min-h-screen">
      <Navbar />

      {tournament.banner ? (
        <div className="h-48 md:h-64 bg-gray-200 overflow-hidden">
          <img src={tournament.banner} alt={tournament.name} className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className="h-48 md:h-64 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
          <span className="text-8xl">{tournament.game?.icon || '🎮'}</span>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h1 className="font-head text-3xl font-bold text-gray-900">{tournament.name}</h1>
              <span className={`badge ${s.cls}`}>{s.label}</span>
            </div>
            <p className="text-gray-500">{tournament.game?.icon} {tournament.game?.name} · {FORMAT_LABEL[tournament.format] || tournament.format}</p>
          </div>
          {myRegistration ? (
            <div className="card p-4 shrink-0 max-w-xs">
              <div className="text-xs text-gray-500 mb-1">สถานะของคุณ</div>
              <div className="flex items-center gap-2">
                <span className={`badge ${REG_STATUS_LABEL[myRegistration.status]?.cls || 'bg-gray-100 text-gray-600'}`}>
                  {REG_STATUS_LABEL[myRegistration.status]?.label || myRegistration.status}
                </span>
                <Link href="/profile" className="text-xs text-blue-500 hover:underline">ดูในโปรไฟล์</Link>
              </div>
              {myRegistration.team && (
                <div className="text-xs text-gray-500 mt-2">ทีม: <strong>{myRegistration.team.name}</strong></div>
              )}
            </div>
          ) : tournament.status === 'OPEN' && (
            <button onClick={() => {
              if (!me) { router.push('/auth/login'); return }
              setShowRegister(true)
            }} className="btn-primary px-8 py-3 text-lg shrink-0">
              สมัครแข่ง
            </button>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'ผู้เข้าแข่ง', value: `${totalParticipants}/${tournament.maxParticipants}` },
                { label: 'ค่าสมัคร', value: tournament.entryFee === 0 ? 'ฟรี' : `฿${tournament.entryFee.toLocaleString()}` },
                { label: 'รางวัลที่ 1', value: tournament.prizeFirst > 0 ? `฿${tournament.prizeFirst.toLocaleString()}` : '-' },
                { label: 'Format', value: FORMAT_LABEL[tournament.format] || tournament.format },
              ].map((stat, i) => (
                <div key={i} className="card p-4 text-center">
                  <div className="font-head font-bold text-lg text-gray-900">{stat.value}</div>
                  <div className="text-xs text-gray-500 mt-1">{stat.label}</div>
                </div>
              ))}
            </div>

            {tournament.description && (
              <div className="card p-6">
                <h2 className="font-head font-bold text-lg mb-3">รายละเอียด</h2>
                <p className="text-gray-600 whitespace-pre-wrap">{tournament.description}</p>
              </div>
            )}

            {tournament.rules && (
              <div className="card p-6">
                <h2 className="font-head font-bold text-lg mb-3">กติกา</h2>
                <pre className="text-gray-600 text-sm whitespace-pre-wrap font-sans">{tournament.rules}</pre>
              </div>
            )}

            {roundGroups.length > 0 && (
              <div className="card p-6">
                <h2 className="font-head font-bold text-lg mb-4">Bracket / ผลแมตช์</h2>
                <div className="space-y-6">
                  {roundGroups.map(group => (
                    <div key={`${group.bracket}-${group.round}`}>
                      <h3 className="text-sm font-semibold text-gray-500 mb-2 uppercase tracking-wide">
                        {group.bracket === 'GRAND_FINAL' ? '🏆 Grand Final' :
                          group.bracket === 'LOWER' ? `Lower Bracket · Round ${group.round}` :
                          `Round ${group.round}`}
                      </h3>
                      <div className="grid sm:grid-cols-2 gap-2">
                        {group.items.map(m => {
                          const aWin = m.winnerId && m.winnerId === m.participantA?.id
                          const bWin = m.winnerId && m.winnerId === m.participantB?.id
                          const finished = m.status === 'FINISHED'
                          return (
                            <div key={m.id} className="border border-gray-100 rounded-lg overflow-hidden text-sm">
                              <div className={`flex items-center justify-between px-3 py-2 ${aWin ? 'bg-green-50' : ''}`}>
                                <span className={aWin ? 'font-bold text-gray-900' : 'text-gray-700'}>
                                  {m.participantA?.name || <span className="text-gray-400">TBD</span>}
                                </span>
                                {finished && <span className={`font-bold ${aWin ? 'text-green-600' : 'text-gray-400'}`}>{m.scoreA}</span>}
                              </div>
                              <div className="border-t border-gray-100" />
                              <div className={`flex items-center justify-between px-3 py-2 ${bWin ? 'bg-green-50' : ''}`}>
                                <span className={bWin ? 'font-bold text-gray-900' : 'text-gray-700'}>
                                  {m.participantB?.name || <span className="text-gray-400">TBD</span>}
                                </span>
                                {finished && <span className={`font-bold ${bWin ? 'text-green-600' : 'text-gray-400'}`}>{m.scoreB}</span>}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="card p-5">
              <h3 className="font-head font-bold mb-3">กำหนดการ</h3>
              <div className="space-y-2 text-sm">
                {tournament.regOpenAt && <div><span className="text-gray-500">เปิดรับสมัคร:</span> {new Date(tournament.regOpenAt).toLocaleDateString('th-TH')}</div>}
                {tournament.regCloseAt && <div><span className="text-gray-500">ปิดรับสมัคร:</span> {new Date(tournament.regCloseAt).toLocaleDateString('th-TH')}</div>}
                {tournament.startsAt && <div><span className="text-gray-500">วันแข่ง:</span> {new Date(tournament.startsAt).toLocaleDateString('th-TH')}</div>}
                {!tournament.regOpenAt && !tournament.regCloseAt && !tournament.startsAt && (
                  <div className="text-gray-400 text-xs">ยังไม่กำหนด</div>
                )}
              </div>
            </div>

            {tournament.entryFee > 0 && (
              <div className="card p-5">
                <h3 className="font-head font-bold mb-3">ช่องทางชำระเงิน</h3>
                <div className="space-y-1 text-sm text-gray-600">
                  {tournament.promptpayNumber && <div>PromptPay: <span className="font-mono">{tournament.promptpayNumber}</span></div>}
                  {tournament.promptpayName && <div>ชื่อบัญชี: {tournament.promptpayName}</div>}
                  {tournament.bankAccount && <div>ธนาคาร: <span className="font-mono">{tournament.bankAccount}</span></div>}
                  {tournament.truewalletNumber && <div>TrueWallet: <span className="font-mono">{tournament.truewalletNumber}</span></div>}
                  {!tournament.promptpayNumber && !tournament.bankAccount && !tournament.truewalletNumber && (
                    <div className="text-gray-400 text-xs">ติดต่อ admin เพื่อขอข้อมูลการโอน</div>
                  )}
                </div>
              </div>
            )}

            {tournament.teams?.length > 0 && (
              <div className="card p-5">
                <h3 className="font-head font-bold mb-3">ทีมที่สมัคร ({tournament.teams.length})</h3>
                <div className="space-y-1 max-h-60 overflow-auto">
                  {tournament.teams.map(t => (
                    <div key={t.id} className="text-sm text-gray-700 py-1 border-b border-gray-100 last:border-0">{t.name}</div>
                  ))}
                </div>
              </div>
            )}

            {(tournament.discordLink || tournament.streamLink) && (
              <div className="card p-5">
                <h3 className="font-head font-bold mb-3">ลิงก์</h3>
                <div className="space-y-2">
                  {tournament.discordLink && <a href={tournament.discordLink} target="_blank" rel="noopener noreferrer" className="block text-sm text-blue-500 hover:underline">Discord Server</a>}
                  {tournament.streamLink && <a href={tournament.streamLink} target="_blank" rel="noopener noreferrer" className="block text-sm text-blue-500 hover:underline">Livestream</a>}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showRegister && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4 py-6 overflow-y-auto">
          <div className="card p-6 w-full max-w-md my-auto">
            <h2 className="font-head text-xl font-bold mb-4">สมัครแข่ง {tournament.name}</h2>

            {regError && (
              <div className="rounded-lg px-4 py-3 mb-4 text-sm bg-red-50 text-red-700 border border-red-200">
                {regError}
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-4">
              {tournament.teamMode && (
                <div>
                  <label className="label">ชื่อทีม <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    className="input"
                    placeholder="ชื่อทีมของคุณ"
                    value={regForm.teamName}
                    onChange={e => setRegForm({ ...regForm, teamName: e.target.value })}
                    required
                  />
                </div>
              )}

              {tournament.entryFee > 0 && (
                <>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm space-y-2">
                    <div className="font-semibold text-amber-800">💰 ค่าสมัคร ฿{tournament.entryFee.toLocaleString()}</div>
                    <div className="text-amber-700 text-xs space-y-1">
                      {tournament.promptpayNumber && <div>PromptPay: <strong className="font-mono">{tournament.promptpayNumber}</strong>{tournament.promptpayName ? ` (${tournament.promptpayName})` : ''}</div>}
                      {tournament.bankAccount && <div>ธนาคาร: <strong className="font-mono">{tournament.bankAccount}</strong></div>}
                      {tournament.truewalletNumber && <div>TrueWallet: <strong className="font-mono">{tournament.truewalletNumber}</strong></div>}
                      {!tournament.promptpayNumber && !tournament.bankAccount && !tournament.truewalletNumber && (
                        <div>ติดต่อ admin เพื่อรับข้อมูลการโอน</div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="label">ช่องทางที่โอน</label>
                    <select
                      className="input"
                      value={regForm.channel}
                      onChange={e => setRegForm({ ...regForm, channel: e.target.value })}
                    >
                      <option value="PROMPTPAY">PromptPay</option>
                      <option value="BANK_TRANSFER">โอนธนาคาร</option>
                      <option value="TRUEWALLET">TrueWallet</option>
                    </select>
                  </div>

                  <div>
                    <label className="label">ลิงก์รูปสลิป (HTTPS) <span className="text-red-500">*</span></label>
                    <input
                      type="url"
                      className="input"
                      placeholder="https://..."
                      value={regForm.slipUrl}
                      onChange={e => setRegForm({ ...regForm, slipUrl: e.target.value })}
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      อัพโหลดรูปสลิปไป image host (เช่น <a href="https://imgur.com/upload" target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">imgur</a>) แล้วคัดลอก direct link มาวาง
                    </p>
                  </div>

                  <div>
                    <label className="label">หมายเหตุ (ถ้ามี)</label>
                    <input
                      type="text"
                      className="input"
                      placeholder="เช่น โอนเวลา 14:30"
                      value={regForm.note}
                      onChange={e => setRegForm({ ...regForm, note: e.target.value })}
                    />
                  </div>
                </>
              )}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowRegister(false)} className="btn-secondary flex-1" disabled={regLoading}>ยกเลิก</button>
                <button type="submit" className="btn-primary flex-1" disabled={regLoading}>
                  {regLoading ? 'กำลังสมัคร...' : 'ยืนยันสมัคร'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}
