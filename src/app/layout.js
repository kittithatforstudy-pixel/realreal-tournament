import './globals.css'

export const metadata = {
  title: 'RealReal Tournament — จัดทัวร์นาเมนต์เกม',
  description: 'แพลตฟอร์มจัดการทัวร์นาเมนต์แข่งเกม สร้างทัวร์ สมัครทีม จ่ายเงิน ดู bracket ใช้งานง่าย'
}

export default function RootLayout({ children }) {
  return (
    <html lang="th">
      <body className="bg-gray-50 text-gray-900 antialiased">
        {children}
      </body>
    </html>
  )
}
