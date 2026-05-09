'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { useToast } from '@/components/Toast'
import ImageUpload from '@/components/ImageUpload'

export default function AdminPage() {
  const toast = useToast()
  const [tournaments, setTournaments] = useState([])
  const [payments, setPayments] = useState([])
  const [games, setGames] = useState([])
  const [tab, setTab] = useState('dashboard')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Create tournament form
  const [showCreate, setShowCreate] = useState(false)
  const [createForm, setCreateForm] = useState({ name: '', gameName: '', banner: '', format: 'SINGLE_ELIM', maxParticipants: 16, entryFee: 0, teamMode: true, teamSize: 5 })
  const [createMsg, setCreateMsg] = useState('')

  // Platform settings
  const [settings, setSettings] = useState({ discordServerLink: '', registrationFormUrl: '' })
  const [settingsSaving, setSettingsSaving] = useState(false)

  // Team management modal
  const [teamModal, setTeamModal] = useState(null) // { tournamentId, tournamentName, maxParticipants }
  const [teams, setTeams] = useState([])
  const [teamsLoading, setTeamsLoading] = useState(false)
  const [newTeamName, setNewTeamName] = useState('')
  const [addingTeam, setAddingTeam] = useState(false)
  const [editingTeam, setEditingTeam] = useState(null) // { id, name }
  const [editTeamName, setEditTeamName] = useState('')

  useEffect(() => {
    Promise.all([
      fetch('/api/tournaments?all=1').then(r => r.json()),
      fetch('/api/payments/pending').then(r => r.json()),
      fetch('/api/games').then(r => r.json()),
      fetch('/api/platform-settings').then(r => r.ok ? r.json() : {}),
    ]).then(([t, p, g, s]) => {
      if (!Array.isArray(p)) {
        setError('ไม่สามารถโหลดข้อมูลได้ กรุณาเข้าสู่ระบบด้วยบัญชี Admin')
      }
      setTournaments(Array.isArray(t) ? t : [])
      setPayments(Array.isArray(p) ? p : [])
      setGames(Array.isArray(g) ? g : [])
      setSettings({ discordServerLink: s?.discordServerLink || '', registrationFormUrl: s?.registrationFormUrl || '' })
      setLoading(false)
    }).catch(() => {
      setError('ไม่สามารถโหลดข้อมูลได้ กรุณาเข้าสู่ระบบด้วยบัญชี Admin')
      setLoading(false)
    })
  }, [])

  async function handleApprove(paymentId, action) {
    const res = await fetch(`/api/payments/${paymentId}/approve`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action })
    })
    if (res.ok) {
      setPayments(prev => prev.filter(p => p.id !== paymentId))
      toast.show(action === 'approve' ? 'Approve สลิปแล้ว' : 'Reject สลิปแล้ว', 'success')
    } else {
      const d = await res.json().catch(() => ({}))
      toast.show(d.error || 'ดำเนินการไม่สำเร็จ', 'error')
    }
  }

  async function handleCreateTournament(e) {
    e.preventDefault()
    setCreateMsg('')
    const res = await fetch('/api/tournaments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(createForm)
    })
    const data = await res.json()
    if (!res.ok) {
      setCreateMsg(data.error || 'สร้างไม่สำเร็จ')
    } else {
      toast.show('สร้างทัวร์เรียบร้อย', 'success')
      setTournaments(prev => [data, ...prev])
      setShowCreate(false)
      setCreateForm({ name: '', gameName: '', banner: '', format: 'SINGLE_ELIM', maxParticipants: 16, entryFee: 0, teamMode: true, teamSize: 5 })
    }
  }

  async function handleGenerateBracket(tournamentId) {
    const res = await fetch(`/api/tournaments/${tournamentId}/bracket`, { method: 'POST' })
    const data = await res.json()
    if (res.ok) {
      toast.show(`สร้าง bracket สำเร็จ (${data.matchCount} แมตช์)`, 'success')
      setTournaments(prev => prev.map(t => t.id === tournamentId ? { ...t, status: 'LIVE' } : t))
    } else {
      toast.show(data.error || 'สร้าง bracket ไม่สำเร็จ', 'error')
    }
  }

  async function handleStatusChange(tournamentId, status) {
    const res = await fetch(`/api/tournaments/${tournamentId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    })
    if (res.ok) {
      setTournaments(prev => prev.map(t => t.id === tournamentId ? { ...t, status } : t))
      toast.show('อัปเดตสถานะแล้ว', 'success')
    } else {
      const d = await res.json().catch(() => ({}))
      toast.show(d.error || 'อัปเดตสถานะไม่สำเร็จ', 'error')
    }
  }

  async function handleSaveSettings(e) {
    e.preventDefault()
    setSettingsSaving(true)
    const res = await fetch('/api/platform-settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    })
    if (res.ok) {
      toast.show('บันทึกการตั้งค่าแล้ว', 'success')
    } else {
      const d = await res.json().catch(() => ({}))
      toast.show(d.error || 'บันทึกไม่สำเร็จ', 'error')
    }
    setSettingsSaving(false)
  }

  function openTeamModal(tournament) {
    setTeamModal({ tournamentId: tournament.id, tournamentName: tournament.name, maxParticipants: tournament.maxParticipants })
    setNewTeamName('')
    setEditingTeam(null)
    setTeamsLoading(true)
    fetch(`/api/tournaments/${tournament.id}/teams`)
      .then(r => r.json())
      .then(d => { setTeams(Array.isArray(d) ? d : []); setTeamsLoading(false) })
      .catch(() => setTeamsLoading(false))
  }

  async function handleAddTeam(e) {
    e.preventDefault()
    if (!newTeamName.trim()) return
    setAddingTeam(true)
    const res = await fetch(`/api/tournaments/${teamModal.tournamentId}/teams`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newTeamName.trim() })
    })
    const data = await res.json()
    if (res.ok) {
      setTeams(prev => [...prev, data])
      setNewTeamName('')
      toast.show('เพิ่มทีมแล้ว', 'success')
    } else {
      toast.show(data.error || 'เพิ่มทีมไม่สำเร็จ', 'error')
    }
    setAddingTeam(false)
  }

  async function handleRenameTeam(e) {
    e.preventDefault()
    if (!editTeamName.trim()) return
    const res = await fetch(`/api/tournaments/${teamModal.tournamentId}/teams/${editingTeam.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editTeamName.trim() })
    })
    const data = await res.json()
    if (res.ok) {
      setTeams(prev => prev.map(t => t.id === editingTeam.id ? { ...t, name: data.name } : t))
      setEditingTeam(null)
      toast.show('แก้ไขชื่อแล้ว', 'success')
    } else {
      toast.show(data.error || 'แก้ไขชื่อไม่สำเร็จ', 'error')
    }
  }

  async function handleDeleteTeam(teamId, teamName) {
    if (!confirm(`ลบทีม "${teamName}" ออกจากทัวร์นี้?`)) return
    const res = await fetch(`/api/tournaments/${teamModal.tournamentId}/teams/${teamId}`, { method: 'DELETE' })
    if (res.ok) {
      setTeams(prev => prev.filter(t => t.id !== teamId))
      toast.show('ลบทีมแล้ว', 'success')
    } else {
      const d = await res.json().catch(() => ({}))
      toast.show(d.error || 'ลบทีมไม่สำเร็จ', 'error')
    }
  }

  async function handleDeleteTournament(tournamentId, name) {
    if (!confirm(`ลบทัวร์ "${name}" ใช่ไหม?\n\nการกระทำนี้ไม่สามารถย้อนกลับได้`)) return
    const res = await fetch(`/api/tournaments/${tournamentId}`, { method: 'DELETE' })
    if (res.ok) {
      setTournaments(prev => prev.filter(t => t.id !== tournamentId))
      toast.show('ลบทัวร์เรียบร้อย', 'success')
    } else {
      const d = await res.json().catch(() => ({}))
      toast.show(d.error || 'ลบไม่สำเร็จ', 'error')
    }
  }

  if (loading) return (
    <main className="min-h-screen bg-gray-50">
      <Navbar variant="admin" />
      <div className="flex items-center justify-center py-32 text-gray-400">กำลังโหลด...</div>
    </main>
  )

  return (
    <main className="min-h-screen bg-gray-50">
      <Navbar variant="admin" />

      {error && (
        <div className="max-w-5xl mx-auto px-4 pt-6">
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3">
            {error} — <Link href="/auth/login" className="underline font-semibold">เข้าสู่ระบบ</Link>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1">
            {[
              { key: 'dashboard', label: '📊 ภาพรวม' },
              { key: 'tournaments', label: '🏆 ทัวร์นาเมนต์' },
              { key: 'payments', label: `💰 สลิปรอ Approve${payments.length > 0 ? ` (${payments.length})` : ''}` },
              { key: 'games', label: '🎮 เกม' },
              { key: 'settings', label: '⚙️ ตั้งค่า' },
            ].map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${tab === t.key ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* DASHBOARD */}
        {tab === 'dashboard' && (
          <div>
            <h1 className="font-head text-2xl font-bold mb-6">ภาพรวม</h1>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[
                { label: 'ทัวร์ทั้งหมด', value: tournaments.length, icon: '🏆' },
                { label: 'กำลังแข่ง', value: tournaments.filter(t => t.status === 'LIVE').length, icon: '🔴' },
                { label: 'เปิดรับสมัคร', value: tournaments.filter(t => t.status === 'OPEN').length, icon: '✅' },
                { label: 'สลิปรอ Approve', value: payments.length, icon: '💰' },
              ].map((s, i) => (
                <div key={i} className="card p-5">
                  <div className="text-3xl mb-2">{s.icon}</div>
                  <div className="font-head text-3xl font-bold text-gray-900">{s.value}</div>
                  <div className="text-sm text-gray-500 mt-1">{s.label}</div>
                </div>
              ))}
            </div>

            {payments.length > 0 && (
              <div className="card p-5">
                <h2 className="font-head font-bold text-lg mb-4">สลิปรอ Approve ล่าสุด</h2>
                <div className="space-y-3">
                  {payments.slice(0, 5).map(p => (
                    <div key={p.id} className="flex items-center justify-between text-sm border-b border-gray-100 pb-3 last:border-0">
                      <div>
                        <span className="font-semibold">{p.registration?.user?.displayName || p.registration?.user?.username}</span>
                        <span className="text-gray-500 ml-2">· {p.registration?.tournament?.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900">฿{p.amount.toLocaleString()}</span>
                        <button onClick={() => handleApprove(p.id, 'approve')} className="btn-success text-xs py-1 px-2">Approve</button>
                        <button onClick={() => handleApprove(p.id, 'reject')} className="btn-danger text-xs py-1 px-2">Reject</button>
                      </div>
                    </div>
                  ))}
                </div>
                {payments.length > 5 && (
                  <button onClick={() => setTab('payments')} className="mt-3 text-sm text-blue-500 hover:underline">ดูทั้งหมด ({payments.length})</button>
                )}
              </div>
            )}
          </div>
        )}

        {/* TOURNAMENTS */}
        {tab === 'tournaments' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h1 className="font-head text-2xl font-bold">จัดการทัวร์นาเมนต์</h1>
              <button onClick={() => setShowCreate(true)} className="btn-primary">+ สร้างทัวร์ใหม่</button>
            </div>

            {createMsg && <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 mb-4 text-sm">{createMsg}</div>}

            <div className="card overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">ชื่อ</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">เกม</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">สถานะ</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">ผู้เข้าร่วม</th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-600">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {tournaments.map(t => (
                    <tr key={t.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{t.name}</td>
                      <td className="px-4 py-3 text-gray-500">{t.game?.icon} {t.game?.name}</td>
                      <td className="px-4 py-3">
                        <select
                          value={t.status}
                          onChange={e => handleStatusChange(t.id, e.target.value)}
                          className="text-xs border border-gray-200 rounded px-2 py-1"
                        >
                          {['DRAFT','OPEN','CLOSED','LIVE','FINISHED','CANCELLED'].map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{t._count?.teams ?? 0} / {t.maxParticipants}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <Link href={`/tournaments/${t.id}`} className="btn-secondary text-xs py-1 px-2">ดู</Link>
                          <button onClick={() => openTeamModal(t)} className="btn-secondary text-xs py-1 px-2">👥 ทีม</button>
                          {(t.status === 'CLOSED' || t.status === 'OPEN') && (
                            <button onClick={() => handleGenerateBracket(t.id)} className="btn-primary text-xs py-1 px-2">สร้าง Bracket</button>
                          )}
                          <button onClick={() => handleDeleteTournament(t.id, t.name)} className="btn-danger text-xs py-1 px-2">ลบ</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {tournaments.length === 0 && (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">ยังไม่มีทัวร์นาเมนต์</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* PAYMENTS */}
        {tab === 'payments' && (
          <div>
            <h1 className="font-head text-2xl font-bold mb-6">สลิปรอ Approve ({payments.length})</h1>
            {payments.length === 0 ? (
              <div className="card p-12 text-center text-gray-400">ไม่มีสลิปรอดำเนินการ</div>
            ) : (
              <div className="space-y-4">
                {payments.map(p => (
                  <div key={p.id} className="card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="font-semibold text-gray-900">
                        {p.registration?.user?.displayName || p.registration?.user?.username}
                        <span className="text-gray-400 font-normal ml-1">(@{p.registration?.user?.username})</span>
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        {p.registration?.tournament?.name}
                        {p.registration?.team && ` · ทีม: ${p.registration.team.name}`}
                      </div>
                      <div className="text-sm text-gray-500">ช่องทาง: {p.channel} · ฿{p.amount.toLocaleString()}</div>
                      {p.slipUrl && (
                        <a href={p.slipUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-500 hover:underline mt-1 block">ดูสลิป</a>
                      )}
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => handleApprove(p.id, 'approve')} className="btn-success">Approve</button>
                      <button onClick={() => handleApprove(p.id, 'reject')} className="btn-danger">Reject</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SETTINGS */}
        {tab === 'settings' && (
          <div className="max-w-lg">
            <h1 className="font-head text-2xl font-bold mb-6">ตั้งค่าเว็บไซต์</h1>
            <form onSubmit={handleSaveSettings} className="card p-6 space-y-5">
              <div>
                <label className="label">ลิงก์ Discord Server</label>
                <input
                  type="url"
                  className="input"
                  placeholder="https://discord.gg/..."
                  value={settings.discordServerLink}
                  onChange={e => setSettings(s => ({ ...s, discordServerLink: e.target.value }))}
                />
                <p className="text-xs text-gray-400 mt-1">จะแสดงเป็นปุ่ม "เข้า Discord Server" ในหน้า Login</p>
              </div>
              <div>
                <label className="label">ลิงก์ฟอร์มสมัครทัวร์</label>
                <input
                  type="url"
                  className="input"
                  placeholder="https://forms.gle/... หรือ bit.ly/..."
                  value={settings.registrationFormUrl}
                  onChange={e => setSettings(s => ({ ...s, registrationFormUrl: e.target.value }))}
                />
                <p className="text-xs text-gray-400 mt-1">จะแสดงเป็นปุ่ม "ฟอร์มสมัครทัวร์" ในหน้า Login</p>
              </div>
              <div className="pt-2">
                <button type="submit" className="btn-primary w-full" disabled={settingsSaving}>
                  {settingsSaving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}
                </button>
              </div>
              <p className="text-xs text-gray-400">ปล่อยว่างไว้ถ้าไม่ต้องการแสดงปุ่มนั้น</p>
            </form>
          </div>
        )}

        {/* GAMES */}
        {tab === 'games' && (
          <div>
            <h1 className="font-head text-2xl font-bold mb-6">จัดการเกม ({games.length})</h1>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {games.map(g => (
                <div key={g.id} className="card p-4 flex items-center gap-3">
                  <span className="text-3xl">{g.icon}</span>
                  <div>
                    <div className="font-semibold">{g.name}</div>
                    <div className="text-xs text-gray-500">{g.category} · {g.defaultTeamSize}v{g.defaultTeamSize} · {g._count?.tournaments ?? 0} ทัวร์</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Team Management Modal */}
      {teamModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4 overflow-y-auto">
          <div className="card p-6 w-full max-w-lg my-8">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-head text-xl font-bold">👥 จัดการทีม</h2>
                <p className="text-sm text-gray-500 mt-0.5">{teamModal.tournamentName} · {teams.length}/{teamModal.maxParticipants} ทีม</p>
              </div>
              <button onClick={() => setTeamModal(null)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
            </div>

            {/* Add team form */}
            <form onSubmit={handleAddTeam} className="flex gap-2 mb-4">
              <input
                type="text"
                className="input flex-1"
                placeholder="ชื่อทีมใหม่..."
                value={newTeamName}
                onChange={e => setNewTeamName(e.target.value)}
                disabled={addingTeam}
              />
              <button type="submit" className="btn-primary px-4" disabled={addingTeam || !newTeamName.trim()}>
                {addingTeam ? '...' : '+ เพิ่ม'}
              </button>
            </form>

            {/* Teams list */}
            {teamsLoading ? (
              <div className="text-center py-8 text-gray-400 text-sm">กำลังโหลด...</div>
            ) : teams.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">ยังไม่มีทีม</div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {teams.map((t, i) => (
                  <div key={t.id} className="flex items-center gap-2 border border-gray-100 rounded-lg px-3 py-2">
                    <span className="text-xs text-gray-400 w-5 text-right shrink-0">{i + 1}</span>
                    {editingTeam?.id === t.id ? (
                      <form onSubmit={handleRenameTeam} className="flex gap-2 flex-1">
                        <input
                          autoFocus
                          type="text"
                          className="input text-sm py-1 flex-1"
                          value={editTeamName}
                          onChange={e => setEditTeamName(e.target.value)}
                        />
                        <button type="submit" className="btn-primary text-xs py-1 px-2">บันทึก</button>
                        <button type="button" onClick={() => setEditingTeam(null)} className="btn-secondary text-xs py-1 px-2">ยกเลิก</button>
                      </form>
                    ) : (
                      <>
                        <span className="flex-1 font-medium text-sm text-gray-800">{t.name}</span>
                        <button
                          onClick={() => { setEditingTeam(t); setEditTeamName(t.name) }}
                          className="text-xs text-blue-500 hover:text-blue-700 px-2 py-1"
                        >แก้ไข</button>
                        <button
                          onClick={() => handleDeleteTeam(t.id, t.name)}
                          className="text-xs text-red-500 hover:text-red-700 px-2 py-1"
                        >ลบ</button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Tournament Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4 overflow-y-auto">
          <div className="card p-6 w-full max-w-lg my-8">
            <h2 className="font-head text-xl font-bold mb-5">สร้างทัวร์นาเมนต์ใหม่</h2>
            <form onSubmit={handleCreateTournament} className="space-y-4">
              <div>
                <label className="label">ชื่อทัวร์ *</label>
                <input className="input" required value={createForm.name} onChange={e => setCreateForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <ImageUpload
                label="Banner ทัวร์ (ตัวเลือก)"
                value={createForm.banner}
                onChange={url => setCreateForm(f => ({ ...f, banner: url }))}
                helpText="ขนาดแนะนำ 1200×400 px"
              />
              <div>
                <label className="label">เกม * <span className="text-gray-400 font-normal">(พิมพ์ชื่อเกม เช่น Valorant, RoV, PUBG)</span></label>
                <input
                  type="text"
                  className="input"
                  required
                  placeholder="ชื่อเกม..."
                  value={createForm.gameName}
                  onChange={e => setCreateForm(f => ({ ...f, gameName: e.target.value }))}
                  list="game-suggestions"
                />
                <datalist id="game-suggestions">
                  {games.map(g => <option key={g.id} value={g.name} />)}
                </datalist>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Format</label>
                  <select className="input" value={createForm.format} onChange={e => setCreateForm(f => ({ ...f, format: e.target.value }))}>
                    <option value="SINGLE_ELIM">Single Elimination</option>
                    <option value="DOUBLE_ELIM">Double Elimination</option>
                    <option value="ROUND_ROBIN">Round Robin</option>
                    <option value="SWISS">Swiss</option>
                    <option value="BATTLE_ROYALE">Battle Royale</option>
                    <option value="GROUP_PLAYOFF">Group + Playoff</option>
                  </select>
                </div>
                <div>
                  <label className="label">จำนวนสูงสุด</label>
                  <input type="number" className="input" min={2} max={256} value={createForm.maxParticipants} onChange={e => setCreateForm(f => ({ ...f, maxParticipants: +e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">ค่าสมัคร (฿)</label>
                  <input type="number" className="input" min={0} value={createForm.entryFee} onChange={e => setCreateForm(f => ({ ...f, entryFee: +e.target.value }))} />
                </div>
                <div>
                  <label className="label">ขนาดทีม</label>
                  <input type="number" className="input" min={1} max={10} value={createForm.teamSize} onChange={e => setCreateForm(f => ({ ...f, teamSize: +e.target.value }))} />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="teamMode" checked={createForm.teamMode} onChange={e => setCreateForm(f => ({ ...f, teamMode: e.target.checked }))} className="rounded" />
                <label htmlFor="teamMode" className="text-sm font-semibold text-gray-600">แข่งแบบทีม</label>
              </div>
              {createMsg && <div className="text-red-600 text-sm">{createMsg}</div>}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary flex-1">ยกเลิก</button>
                <button type="submit" className="btn-primary flex-1">สร้างทัวร์</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}
