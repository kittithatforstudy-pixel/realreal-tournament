'use client'

import { useState } from 'react'

const MAX_BYTES = 10 * 1024 * 1024 // 10MB

export default function ImageUpload({ value, onChange, label = 'รูปภาพ', accept = 'image/*', helpText }) {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
  const cloudinaryReady = Boolean(cloudName && uploadPreset)

  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  async function handleFile(file) {
    if (!file) return
    if (file.size > MAX_BYTES) {
      setError('ไฟล์ใหญ่เกิน 10MB')
      return
    }
    setUploading(true)
    setError('')
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('upload_preset', uploadPreset)
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData
      })
      const data = await res.json()
      if (!res.ok || !data.secure_url) {
        throw new Error(data?.error?.message || 'Upload failed')
      }
      onChange(data.secure_url)
    } catch (e) {
      setError(e.message || 'อัพโหลดไม่สำเร็จ')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      {label && <label className="label">{label}</label>}

      {value && (
        <div className="mb-2 relative inline-block">
          <img src={value} alt="" className="max-h-40 rounded-lg border border-gray-200" />
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 text-xs flex items-center justify-center shadow hover:bg-red-600"
            aria-label="ลบรูป"
          >×</button>
        </div>
      )}

      {cloudinaryReady ? (
        <label className="block cursor-pointer">
          <div className={`border-2 border-dashed rounded-lg px-4 py-6 text-center text-sm transition-colors ${
            uploading
              ? 'bg-gray-50 text-gray-400 border-gray-200'
              : 'border-gray-300 text-gray-600 hover:border-blue-400 hover:text-blue-500'
          }`}>
            {uploading ? '⏳ กำลังอัพโหลด...' : value ? '🔄 เปลี่ยนรูป' : '📷 คลิกเพื่อเลือกรูป (สูงสุด 10MB)'}
          </div>
          <input
            type="file"
            accept={accept}
            className="hidden"
            disabled={uploading}
            onChange={e => {
              handleFile(e.target.files?.[0])
              e.target.value = '' // allow re-selecting same file
            }}
          />
        </label>
      ) : (
        <input
          type="url"
          className="input"
          placeholder="https://..."
          value={value || ''}
          onChange={e => onChange(e.target.value)}
        />
      )}

      {(helpText || !cloudinaryReady) && (
        <p className="text-xs text-gray-500 mt-1">
          {!cloudinaryReady
            ? 'อัพโหลดรูปไปที่ image host (เช่น imgur) แล้ววาง URL'
            : helpText}
        </p>
      )}
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  )
}
