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

const PAYMENT_STATUS = {
  PENDING: { label: 'รอ Approve', cls: 'bg-yellow-100 text-yellow-700' },
  APPROVED: { label: 'ผ่าน', cls: 'bg-green-100 text-green-700' },
  REJECTED: { label: 'ไม่ผ่าน', cls: 'bg-red-100 text-red-700' },
}

export default function ProfilePage() {
  const router = useRouter()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [authed, setAuthed] = useState(false)

  useEffect(() => {
    fetch('/api/me')
      .then(async r => {
        if (r.status === 401) {
          setAuthed(false)
          return null
        }
        if (!r.ok) throw new Error('error')
        setAuthed(true)
        return r.json()
      })
      .then(d => { if (d) setData(d) })
      .catch(() => setAuthed(false))
      .finally(() => setLoading(false))
  }, [])

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {})
    router.push('/')
    router.refresh()
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-400">กำลังโหลด...</div>
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
              {authed ? (
                <button onClick={handleLogout} className="btn-secondary text-sm">ออกจากระบบ</button>
              ) : (
                <Link href="/auth/login" className="btn-secondary text-sm">เข้าสู่ระบบ</Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-12">
        {!authed && (
          <>
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
          </>
        )}

        {authed && data && (
          <>
            {/* User card */}
            <div className="card p-6 mb-6">
              <div className="flex items-start gap-4">
                <div className="text-5xl">👤</div>
                <div className="flex-1">
                  <h1 className="font-head text-2xl font-bold text-gray-900">
                    {data.user.displayName || data.user.username}
                  </h1>
                  <p className="text-gray-500 text-sm">@{data.user.username}</p>
                  <div className="mt-3 grid sm:grid-cols-2 gap-2 text-sm">
                    <div><span className="text-gray-500">Email:</span> {data.user.email}</div>
                    {data.user.phone && <div><span className="text-gray-500">เบอร์โทร:</span> {data.user.phone}</div>}
                    {data.user.discordId && <div><span className="text-gray-500">Discord:</span> {data.user.discordId}</div>}
                    {data.user.lineId && <div><span className="text-gray-500">LINE:</span> {data.user.lineId}</div>}
                    <div><span className="text-gray-500">สิทธิ์:</span> {data.user.role}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Registrations */}
            <div className="card p-6 mb-6">
              <h2 className="font-head font-bold text-lg mb-4">ทัวร์ที่สมัคร ({data.registrations.length})</h2>
              {data.registrations.length === 0 ? (
                <p className="text-gray-400 text-sm">ยังไม่ได้สมัครทัวร์ใด <Link href="/tournaments" className="text-blue-500 hover:underline">ดูทัวร์ทั้งหมด</Link></p>
              ) : (
                <div className="space-y-3">
                  {data.registrations.map(r => {
                    const s = REG_STATUS[r.status] || { label: r.status, cls: 'bg-gray-100 text-gray-600' }
                    const lastPayment = (r.payments || []).slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0]
                    const ps = lastPayment ? PAYMENT_STATUS[lastPayment.status] : null
                    return (
                      <div key={r.id} className="border border-gray-100 rounded-lg p-4 flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <Link href={`/tournaments/${r.tournament?.id}`} className="font-semibold text-gray-900 hover:text-blue-600">
                            {r.tournament?.game?.icon} {r.tournament?.name || 'Unknown'}
                          </Link>
                          {r.team && <div className="text-xs text-gray-500 mt-0.5">ทีม: {r.team.name} · code: {r.team.inviteCode}</div>}
                          {r.tournament?.startsAt && (
                            <div className="text-xs text-gray-500 mt-0.5">วันแข่ง: {new Date(r.tournament.startsAt).toLocaleDateString('th-TH')}</div>
                          )}
                          {lastPayment && (
                            <div className="text-xs text-gray-500 mt-1">
                              ชำระ: ฿{lastPayment.amount?.toLocaleString?.() ?? lastPayment.amount} ·
                              <span className={`badge ml-1 ${ps?.cls || 'bg-gray-100 text-gray-600'}`}>{ps?.label || lastPayment.status}</span>
                            </div>
                          )}
                        </div>
                        <span className={`badge ${s.cls} shrink-0`}>{s.label}</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Team memberships */}
            {data.teamMemberships.length > 0 && (
              <div className="card p-6">
                <h2 className="font-head font-bold text-lg mb-4">ทีมของฉัน ({data.teamMemberships.length})</h2>
                <div className="space-y-2">
                  {data.teamMemberships.map(m => (
                    <div key={m.id} className="flex items-center justify-between border-b border-gray-100 pb-2 last:border-0">
                      <div>
                        <div className="font-medium text-gray-900">{m.team?.name}</div>
                        <div className="text-xs text-gray-500">บทบาท: {m.role} · code: {m.team?.inviteCode}</div>
                      </div>
                      <Link href={`/tournaments/${m.team?.tournamentId}`} className="text-sm text-blue-500 hover:underline">ดูทัวร์</Link>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  )
}
