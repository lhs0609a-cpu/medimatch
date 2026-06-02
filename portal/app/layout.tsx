import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '메디플라톤 | 의료인을 위한 맞춤형 금융솔루션',
  description: '의료기관부터 대기업까지 - 메디플라톤이 자금 조달과 맞춤형 금융 컨설팅을 함께합니다.',
  keywords: ['병원대출', '의료금융', '금융솔루션', '금융컨설팅', '메디플라톤'],
  openGraph: {
    title: '메디플라톤 | 의료인을 위한 맞춤형 금융솔루션',
    description: '의료기관부터 대기업까지 - 메디플라톤이 자금 조달과 맞춤형 금융 컨설팅을 함께합니다.',
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
      <body className="min-h-screen" style={{ background: '#fafaf7' }}>
        {children}
      </body>
    </html>
  )
}
