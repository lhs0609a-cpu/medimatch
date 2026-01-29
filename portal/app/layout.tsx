import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '메디플라톤 | 의료인의 성공적인 개원 파트너',
  description: '병원 개원, 마케팅, 대출까지 - 메디플라톤이 의료인의 성공적인 개원을 함께합니다.',
  keywords: ['병원개원', '의료마케팅', '병원대출', '개원컨설팅', '메디플라톤'],
  openGraph: {
    title: '메디플라톤 | 의료인의 성공적인 개원 파트너',
    description: '병원 개원, 마케팅, 대출까지 - 메디플라톤이 의료인의 성공적인 개원을 함께합니다.',
    type: 'website',
    locale: 'ko_KR',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body className="bg-slate-50 min-h-screen">
        {children}
      </body>
    </html>
  )
}
