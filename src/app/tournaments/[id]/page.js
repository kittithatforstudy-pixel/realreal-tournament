'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

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
  const [showRegister, setShowRegister] = useState(false)
  const [regForm, setRegForm] = useState({ teamName: '' })
  const [regLoading, setRegLoading] = useState(false)
  const [regMsg, setRegMsg] = useState('')

  useEffect(() => {
    fetch(`/api/tournaments/${id}`)
      .then(r => r.json())
      .then(data => { setTournament(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [id])

  async function handleRegister(e) {
    e.preventDefault()
    setRegLoading(true)
    setRegMsg('')
    try {
      const res = await fetch(`/api/tournaments/${id}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamName: regForm.teamName })
      })
      const data = await res.json()
      if (!res.ok) {
        setRegMsg(data.error || 'สมัครไม่สำเร็จ')
      } else {
        setRegMsg('สมัครสำเร็จ!')
        setShowRegister(false)
        fetch(`/api/tournaments/${id}`).then(r => r.json()).then(setTournament)
      }
    } catch {
      setRegMsg('เกิดข้อผิดพลาด')
    } finally {
      setRegLoading(false)
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">กำลังโหลด...</div>
  if (!tournament || tournament.error) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <p className="text-gray-500">ไม่พบทัวร์นาเมนต์</p>
      <Link href="/tournaments" className="btn-primary">กลับหน้ารายการ</Link>
    </div>
  )

  const s = STATUS_LABEL[tournament.status] || { label: tournament.status, cls: 'badge-closed' }
  const totalParticipants = tournament._count?.teams ?? tournament._count?.registrations ?? 0

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
              <Link href="/tournaments" className="btn-secondary text-sm">← ทัวร์ทั้งหมด</Link>
              <Link href="/auth/login" className="btn-secondary text-sm">เข้าสู่ระบบ</Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Banner */}
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
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="font-head text-3xl font-bold text-gray-900">{tournament.name}</h1>
              <span className={`badge ${s.cls}`}>{s.label}</span>
            </div>
            <p className="text-gray-500">{tournament.game?.icon} {tournament.game?.name} · {FORMAT_LABEL[tournament.format] || tournament.format}</p>
          </div>
          {tournament.status === 'OPEN' && (
            <button onClick={() => setShowRegister(true)} className="btn-primary px-8 py-3 text-lg shrink-0">
              สมัครแข่ง
            </button>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Left: info */}
          <div className="md:col-span-2 space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'ผู้เข้าแข่ง', value: `${totalParticipants}/${tournament.maxParticipants}` },
                { label: 'ค่าสมัคร', value: tournament.entryFee === 0 ? 'ฟรี' : `฿${tournament.entryFee.toLocaleString()}` },
                { label: 'รางวัลที่ 1', value: tournament.prizeFirst > 0 ? `฿${tournament.prizeFirst.toLocaleString()}` : '-' },
                { label: 'Format', value: FORMAT_LABEL[tournament.format] || tournament.format },
              ].map((s, i) => (
                <div key={i} className="card p-4 text-center">
                  <div className="font-head font-bold text-lg text-gray-900">{s.value}</div>
                  <div className="text-xs text-gray-500 mt-1">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Description */}
            {tournament.description && (
              <div className="card p-6">
                <h2 className="font-head font-bold text-lg mb-3">รายละเอียด</h2>
                <p className="text-gray-600 whitespace-pre-wrap">{tournament.description}</p>
              </div>
            )}

            {/* Rules */}
            {tournament.rules && (
              <div className="card p-6">
                <h2 className="font-head font-bold text-lg mb-3">กติกา</h2>
                <pre className="text-gray-600 text-sm whitespace-pre-wrap font-sans">{tournament.rules}</pre>
              </div>
            )}

            {/* Matches */}
            {tournament.matches?.length > 0 && (
              <div className="card p-6">
                <h2 className="font-head font-bold text-lg mb-4">Bracket / ผลแมตช์</h2>
                <div className="space-y-2">
                  {tournament.matches.map(m => (
                    <div key={m.id} className="flex items-center justify-between text-sm bg-gray-50 rounded-lg px-4 py-2">
                      <span className="text-gray-500">Round {m.round} · Match {m.matchNumber}</span>
                      <span className="font-semibold">
                        {m.participantA?.name || 'TBD'} vs {m.participantB?.name || 'TBD'}
                      </span>
                      {m.status === 'FINISHED' && (
                        <span className="text-blue-600 font-bold">{m.scoreA} - {m.scoreB}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: sidebar */}
          <div className="space-y-4">
            {/* Schedule */}
            <div className="card p-5">
              <h3 className="font-head font-bold mb-3">กำหนดการ</h3>
              <div className="space-y-2 text-sm">
                {tournament.regOpenAt && <div><span className="text-gray-500">เปิดรับสมัคร:</span> {new Date(tournament.regOpenAt).toLocaleDateString('th-TH')}</div>}
                {tournament.regCloseAt && <div><span className="text-gray-500">ปิดรับสมัคร:</span> {new Date(tournament.regCloseAt).toLocaleDateString('th-TH')}</div>}
                {tournament.startsAt && <div><span className="text-gray-500">วันแข่ง:</span> {new Date(tournament.startsAt).toLocaleDateString('th-TH')}</div>}
              </div>
            </div>

            {/* Payment methods */}
            {tournament.entryFee > 0 && (
              <div className="card p-5">
                <h3 className="font-head font-bold mb-3">ช่องทางชำระเงิน</h3>
                <div className="space-y-1 text-sm text-gray-600">
                  {tournament.promptpayNumber && <div>PromptPay: {tournament.promptpayNumber}</div>}
                  {tournament.bankAccount && <div>โอนธนาคาร: {tournament.bankAccount}</div>}
                  {tournament.truewalletNumber && <div>TrueWallet: {tournament.truewalletNumber}</div>}
                </div>
              </div>
            )}

            {/* Teams */}
            {tournament.teams?.length > 0 && (
              <div className="card p-5">
                <h3 className="font-head font-bold mb-3">ทีมที่สมัคร ({tournament.teams.length})</h3>
                <div className="space-y-1">
                  {tournament.teams.map(t => (
                    <div key={t.id} className="text-sm text-gray-700 py-1 border-b border-gray-100 last:border-0">{t.name}</div>
                  ))}
                </div>
              </div>
            )}

            {/* Links */}
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

      {/* Register Modal */}
      {showRegister && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="card p-6 w-full max-w-md">
            <h2 className="font-head text-xl font-bold mb-4">สมัครแข่ง {tournament.name}</h2>

            {regMsg && (
              <div className={`rounded-lg px-4 py-3 mb-4 text-sm ${regMsg.includes('สำเร็จ') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                {regMsg}
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-4">
              {tournament.teamMode && (
                <div>
                  <label className="label">ชื่อทีม</label>
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
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-700">
                  ค่าสมัคร ฿{tournament.entryFee.toLocaleString()} — กรุณาโอนเงินและแนบสลิปหลังสมัคร
                </div>
              )}

              <div className="flex gap-3">
                <button type="button" onClick={() => setShowRegister(false)} className="btn-secondary flex-1">ยกเลิก</button>
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
