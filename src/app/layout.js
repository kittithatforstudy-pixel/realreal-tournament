import './globals.css'
import Providers from '@/components/Providers'

export const metadata = {
  title: {
    default: 'RealReal Tournament — จัดทัวร์นาเมนต์เกม',
    template: '%s · RealReal Tournament'
  },
  description: 'แพลตฟอร์มจัดการทัวร์นาเมนต์แข่งเกม สร้างทัวร์ สมัครทีม จ่ายเงิน ดู bracket ใช้งานง่าย',
  metadataBase: process.env.NEXT_PUBLIC_APP_URL ? new URL(process.env.NEXT_PUBLIC_APP_URL) : undefined,
  openGraph: {
    title: 'RealReal Tournament',
    description: 'จัดทัวร์นาเมนต์ยังไงก็ได้',
    type: 'website',
    locale: 'th_TH'
  }
}

export default function RootLayout({ children }) {
  return (
    <html lang="th">
      <body className="bg-gray-50 text-gray-900 antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
