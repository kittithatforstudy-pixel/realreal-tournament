import Link from 'next/link'

export default function HomePage() {
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
            <div className="hidden md:flex items-center gap-6">
              <Link href="/tournaments" className="text-gray-600 hover:text-blue-500 transition-colors">ทัวร์นาเมนต์</Link>
              <Link href="/profile" className="text-gray-600 hover:text-blue-500 transition-colors">โปรไฟล์</Link>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/auth/login" className="btn-secondary text-sm">เข้าสู่ระบบ</Link>
              <Link href="/auth/register" className="btn-primary text-sm">สมัครสมาชิก</Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50 py-20 lg:py-28">
        <div className="absolute inset-0 opacity-30" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 30h60M30 0v60' stroke='%23e0e7ff' stroke-width='0.5'/%3E%3C/svg%3E")`
        }} />
        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <h1 className="font-head text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 leading-tight">
            ⚡ จัดทัวร์นาเมนต์<br />
            <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">ยังไงก็ได้</span>
          </h1>
          <p className="text-gray-500 text-lg md:text-xl mb-8 max-w-2xl mx-auto">
            ตั้งค่าเอง ทุกอย่าง — เกม · Format · ทีม · กติกา · ค่าสมัคร · เงินรางวัล
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/tournaments" className="btn-primary text-lg px-8 py-3 shadow-lg hover:shadow-xl">
              🔥 ดูทัวร์ทั้งหมด
            </Link>
            <Link href="/admin" className="btn-secondary text-lg px-8 py-3">
              ⚙️ Admin Panel
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="font-head text-2xl font-bold text-center mb-12">ทำไมต้อง RealReal Tournament?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: '🎮', title: 'รองรับทุกเกม', desc: 'เพิ่มเกมใหม่ได้ไม่จำกัด ตั้ง format เฉพาะเกมได้' },
              { icon: '🏆', title: '6 Format', desc: 'Single/Double Elim, Round Robin, Swiss, Battle Royale, กลุ่ม+Playoff' },
              { icon: '💰', title: 'จัดการเงินง่าย', desc: 'PromptPay QR, โอนธนาคาร, TrueWallet พร้อม approve สลิป' },
              { icon: '📊', title: 'Bracket อัตโนมัติ', desc: 'สร้างสาย, สุ่ม seed, กรอกผล แล้วเลื่อนผู้ชนะอัตโนมัติ' },
              { icon: '✅', title: 'Check-in ก่อนแข่ง', desc: 'ระบบ check-in + DQ อัตโนมัติถ้าไม่พร้อม' },
              { icon: '🤖', title: 'Discord Integration', desc: 'Webhook แจ้งเตือนอัตโนมัติ สมัคร/สลิป/ผลแมตช์' }
            ].map((f, i) => (
              <div key={i} className="card p-6 hover:shadow-md transition-shadow">
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="font-head font-bold text-lg mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-sm">⚡ RealReal Tournament — จัดทัวร์นาเมนต์แข่งเกม</p>
        </div>
      </footer>
    </main>
  )
}
