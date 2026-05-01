'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { useToast } from '@/components/Toast'
import { SkeletonBlock } from '@/components/Skeleton'
import ImageUpload from '@/components/ImageUpload'

const REG_STATUS = {
  PENDING: { label: 'รอยืนยัน', cls: 'bg-yellow-100 text-yellow-700' },
  CONFIRMED: { label: 'ยืนยันแล้ว', cls: 'bg-green-100 text-green-700' },
  CANCELLED: { label: 'ยกเลิก', cls: 'bg-gray-100 text-gray-600' },
  DQ: { label: 'ถูก DQ', cls: 'bg-red-100 text-red-700' },
}

const TOUR_STATUS = {
  DRAFT: { label: 'ร่าง', cls: 'bg-gray-100 text-gray-600' },
  OPEN: { label: 'เปิดรับสมัคร', cls: 'bg-emerald-100 text-emerald-700' },
  CLOSED: { label: 'ปิดรับสมัคร', cls: 'bg-gray-100 text-gray-600' },
  LIVE: { label: 'กำลังแข่ง', cls: 'bg-red-100 text-red-700' },
  FINISHED: { label: 'จบแล้ว', cls: 'bg-gray-100 text-gray-600' },
  CANCELLED: { label: 'ยกเลิก', cls: 'bg-gray-100 text-gray-600' },
}

const PAYMENT_STATUS = {
  PENDING: { label: 'รอ Approve', cls: 'bg-yellow-100 text-yellow-700' },
  APPROVED: { label: 'ผ่าน', cls: 'bg-green-100 text-green-700' },
  REJECTED: { label: 'ไม่ผ่าน', cls: 'bg-red-100 text-red-700' },
}

export default function ProfilePage() {
  const toast = useToast()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [authed, setAuthed] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editForm, setEditForm] = useState({ displayName: '', phone: '', discordId: '', lineId: '', avatar: '' })
  const [saving, setSaving] = useState(false)
  const [tab, setTab] = useState('registrations')
  const [respondingId, setRespondingId] = useState('')

  useEffect(() => {
    fetch('/api/me')
      .then(async r => {
        if (r.status === 401) { setAuthed(false); return null }
        if (!r.ok) throw new Error('error')
        setAuthed(true)
        return r.json()
      })
      .then(d => {
        if (!d) return
        setData(d)
        setEditForm({
          displayName: d.user.displayName || '',
          phone: d.user.phone || '',
          discordId: d.user.discordId || '',
          lineId: d.user.lineId || '',
          avatar: d.user.avatar || ''
        })
      })
      .catch(() => setAuthed(false))
      .finally(() => setLoading(false))
  }, [])

  async function reload() {
    const res = await fetch('/api/me')
    if (res.status === 401) { setAuthed(false); return }
    const d = await res.json()
    setData(d)
  }

  async function respondInvite(inviteId, action) {
    setRespondingId(inviteId)
    try {
      const res = await fetch(`/api/invites/${inviteId}/respond`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      })
      const d = await res.json()
      if (!res.ok) {
        toast.show(d.error || 'ตอบรับไม่สำเร็จ', 'error')
      } else {
        toast.show(action === 'accept' ? 'ตอบรับคำเชิญแล้ว' : 'ปฏิเสธคำเชิญแล้ว', 'success')
        await reload()
      }
    } finally {
      setRespondingId('')
    }
  }

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      })
      const d = await res.json()
      if (!res.ok) {
        toast.show(d.error || 'บันทึกไม่สำเร็จ', 'error')
        return
      }
      setData(prev => prev ? { ...prev, user: d.user } : prev)
      setEditOpen(false)
      toast.show('บันทึกเรียบร้อย', 'success')
    } catch {
      toast.show('เกิดข้อผิดพลาด', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen">
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 py-12 space-y-4">
          <SkeletonBlock className="h-32" />
          <SkeletonBlock className="h-48" />
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen">
      <Navbar />

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
          </>
        )}

        {authed && data && (
          <>
            <div className="card p-6 mb-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 min-w-0">
                  {data.user.avatar ? (
                    <img src={data.user.avatar} alt="" className="w-16 h-16 rounded-full object-cover shrink-0 border border-gray-200" />
                  ) : (
                    <div className="text-5xl shrink-0">👤</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h1 className="font-head text-2xl font-bold text-gray-900 truncate">
                      {data.user.displayName || data.user.username}
                    </h1>
                    <p className="text-gray-500 text-sm">@{data.user.username}</p>
                    <div className="mt-3 grid sm:grid-cols-2 gap-2 text-sm">
                      <div><span className="text-gray-500">Email:</span> {data.user.email}</div>
                      <div><span className="text-gray-500">เบอร์โทร:</span> {data.user.phone || <span className="text-gray-300">-</span>}</div>
                      <div><span className="text-gray-500">Discord:</span> {data.user.discordId || <span className="text-gray-300">-</span>}</div>
                      <div><span className="text-gray-500">LINE:</span> {data.user.lineId || <span className="text-gray-300">-</span>}</div>
                      <div><span className="text-gray-500">สิทธิ์:</span> {data.user.role}</div>
                    </div>
                  </div>
                </div>
                <button onClick={() => setEditOpen(true)} className="btn-secondary text-sm shrink-0">แก้ไข</button>
              </div>
            </div>

            <div className="card mb-6">
              <div className="flex border-b border-cream-200">
                <button
                  onClick={() => setTab('registrations')}
                  className={`flex-1 px-4 py-3 text-sm font-semibold transition-colors ${tab === 'registrations' ? 'text-amber-700 border-b-2 border-amber-500' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  📋 ประวัติการสมัคร ({data.registrations.length})
                </button>
                <button
                  onClick={() => setTab('invites')}
                  className={`flex-1 px-4 py-3 text-sm font-semibold transition-colors ${tab === 'invites' ? 'text-amber-700 border-b-2 border-amber-500' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  📩 คำเชิญ
                  {(data.invites || []).filter(i => i.status === 'PENDING').length > 0 && (
                    <span className="ml-1 inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-purple-500 text-white text-xs font-bold">
                      {(data.invites || []).filter(i => i.status === 'PENDING').length}
                    </span>
                  )}
                </button>
              </div>

              <div className="p-6">
                {tab === 'registrations' && (
                  data.registrations.length === 0 ? (
                    <p className="text-gray-400 text-sm">ยังไม่ได้สมัครทัวร์ใด <Link href="/tournaments" className="text-amber-600 hover:underline">ดูทัวร์ทั้งหมด</Link></p>
                  ) : (
                    <div className="space-y-3">
                      {data.registrations.map(r => {
                        const s = REG_STATUS[r.status] || { label: r.status, cls: 'bg-gray-100 text-gray-600' }
                        const ts = TOUR_STATUS[r.tournament?.status] || null
                        const lastPayment = (r.payments || []).slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0]
                        const ps = lastPayment ? PAYMENT_STATUS[lastPayment.status] : null
                        return (
                          <div key={r.id} className="border border-cream-200 rounded-lg p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <Link href={`/tournaments/${r.tournament?.id}`} className="font-semibold text-gray-900 hover:text-amber-600">
                                  {r.tournament?.game?.icon} {r.tournament?.name || 'Unknown'}
                                </Link>
                                <div className="flex flex-wrap gap-1.5 mt-1">
                                  <span className={`badge ${s.cls}`}>การสมัคร: {s.label}</span>
                                  {ts && <span className={`badge ${ts.cls}`}>ทัวร์: {ts.label}</span>}
                                </div>
                                {r.inGameName && (
                                  <div className="text-xs text-gray-500 mt-1.5">ชื่อในเกม: <strong>{r.inGameName}</strong></div>
                                )}
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
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )
                )}

                {tab === 'invites' && (
                  (data.invites || []).length === 0 ? (
                    <p className="text-gray-400 text-sm">ยังไม่มีคำเชิญ</p>
                  ) : (
                    <div className="space-y-3">
                      {(data.invites || []).map(inv => {
                        const ts = TOUR_STATUS[inv.tournament?.status] || null
                        const isPending = inv.status === 'PENDING'
                        const isAccepted = inv.status === 'ACCEPTED'
                        const isRejected = inv.status === 'REJECTED'
                        return (
                          <div key={inv.id} className={`border rounded-lg p-4 ${isPending ? 'border-purple-200 bg-purple-50' : 'border-cream-200'}`}>
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <Link href={`/tournaments/${inv.tournament?.id}`} className="font-semibold text-gray-900 hover:text-amber-600">
                                  {inv.tournament?.game?.icon} {inv.tournament?.name || 'Unknown'}
                                </Link>
                                <div className="flex flex-wrap gap-1.5 mt-1">
                                  {isPending && <span className="badge bg-purple-100 text-purple-700">รอตอบรับ</span>}
                                  {isAccepted && <span className="badge bg-green-100 text-green-700">ตอบรับแล้ว</span>}
                                  {isRejected && <span className="badge bg-gray-100 text-gray-600">ปฏิเสธแล้ว</span>}
                                  {ts && <span className={`badge ${ts.cls}`}>ทัวร์: {ts.label}</span>}
                                </div>
                                {inv.tournament?.startsAt && (
                                  <div className="text-xs text-gray-500 mt-0.5">วันแข่ง: {new Date(inv.tournament.startsAt).toLocaleDateString('th-TH')}</div>
                                )}
                              </div>
                              {isPending && (
                                <div className="flex gap-2 shrink-0">
                                  <button
                                    onClick={() => respondInvite(inv.id, 'accept')}
                                    disabled={respondingId === inv.id}
                                    className="btn-primary text-sm"
                                  >ตอบรับ</button>
                                  <button
                                    onClick={() => respondInvite(inv.id, 'reject')}
                                    disabled={respondingId === inv.id}
                                    className="btn-secondary text-sm"
                                  >ปฏิเสธ</button>
                                </div>
                              )}
                              {isAccepted && (
                                <Link href={`/tournaments/${inv.tournament?.id}`} className="btn-primary text-sm shrink-0">สมัครแข่ง</Link>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )
                )}
              </div>
            </div>

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

      {editOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4 py-6 overflow-y-auto">
          <div className="card p-6 w-full max-w-md my-auto">
            <h2 className="font-head text-xl font-bold mb-4">แก้ไขโปรไฟล์</h2>
            <form onSubmit={handleSave} className="space-y-4">
              <ImageUpload
                label="รูปโปรไฟล์"
                value={editForm.avatar}
                onChange={url => setEditForm(f => ({ ...f, avatar: url }))}
              />
              <div>
                <label className="label">ชื่อที่แสดง</label>
                <input type="text" className="input" value={editForm.displayName}
                  onChange={e => setEditForm(f => ({ ...f, displayName: e.target.value }))} />
              </div>
              <div>
                <label className="label">เบอร์โทรศัพท์</label>
                <input type="tel" className="input" placeholder="08X-XXX-XXXX" value={editForm.phone}
                  onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} />
              </div>
              <div>
                <label className="label">Discord ID</label>
                <input type="text" className="input" placeholder="user#1234 หรือ user_name" value={editForm.discordId}
                  onChange={e => setEditForm(f => ({ ...f, discordId: e.target.value }))} />
              </div>
              <div>
                <label className="label">LINE ID</label>
                <input type="text" className="input" value={editForm.lineId}
                  onChange={e => setEditForm(f => ({ ...f, lineId: e.target.value }))} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setEditOpen(false)} className="btn-secondary flex-1" disabled={saving}>ยกเลิก</button>
                <button type="submit" className="btn-primary flex-1" disabled={saving}>{saving ? 'กำลังบันทึก...' : 'บันทึก'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}
