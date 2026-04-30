import './globals.css'
import Providers from '@/components/Providers'

export const metadata = {
  title: {
    default: 'RealReal Tournament — ทัวร์นาเมนต์เกมที่จัดจริง',
    template: '%s · RealReal Tournament'
  },
  description: 'RealReal Tournament — ผู้จัดทัวร์นาเมนต์เกมประจำ เปิดรับสมัครทีม/เดี่ยว แข่งจริง มีเงินรางวัล',
  metadataBase: process.env.NEXT_PUBLIC_APP_URL ? new URL(process.env.NEXT_PUBLIC_APP_URL) : undefined,
  openGraph: {
    title: 'RealReal Tournament',
    description: 'ทัวร์นาเมนต์เกมที่จัดจริง จัดประจำ',
    type: 'website',
    locale: 'th_TH'
  }
}

export default function RootLayout({ children }) {
  return (
    <html lang="th">
      <body className="text-gray-900 antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
