'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { useToast } from '@/components/Toast'
import { SkeletonBlock } from '@/components/Skeleton'
import ImageUpload from '@/components/ImageUpload'


export default function ProfilePage() {
  const toast = useToast()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [authed, setAuthed] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editForm, setEditForm] = useState({ displayName: '', phone: '', discordId: '', lineId: '', avatar: '' })
  const [saving, setSaving] = useState(false)

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
          <div className="card p-8 text-center">
            <div className="text-6xl mb-4">👤</div>
            <h1 className="font-head text-2xl font-bold text-gray-900 mb-2">โปรไฟล์</h1>
            <p className="text-gray-500 mb-6">กรุณาเข้าสู่ระบบ Admin เพื่อดูโปรไฟล์</p>
            <Link href="/auth/login" className="btn-primary px-8">เข้าสู่ระบบ Admin</Link>
          </div>
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

            <div className="card p-5">
              <p className="text-sm text-gray-500">บัญชี Admin · <Link href="/admin" className="text-blue-500 hover:underline">ไปหน้า Admin Dashboard</Link></p>
            </div>
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
