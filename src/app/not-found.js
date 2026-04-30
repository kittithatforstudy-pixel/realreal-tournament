import Link from 'next/link'
import Navbar from '@/components/Navbar'

export const metadata = {
  title: 'ไม่พบหน้าที่ต้องการ'
}

export default function NotFound() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <div className="flex flex-col items-center justify-center text-center px-4 py-32">
        <div className="text-7xl mb-4">🎯</div>
        <h1 className="font-head text-4xl font-bold text-gray-900 mb-2">404</h1>
        <p className="text-gray-500 mb-6">ไม่พบหน้าที่คุณกำลังหาอยู่</p>
        <div className="flex gap-3">
          <Link href="/" className="btn-primary">กลับหน้าหลัก</Link>
          <Link href="/tournaments" className="btn-secondary">ดูทัวร์ทั้งหมด</Link>
        </div>
      </div>
    </main>
  )
}
