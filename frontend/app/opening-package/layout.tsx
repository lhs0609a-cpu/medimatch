import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '개원의 패키지 - 입지분석·중개·PG·마케팅 전부 무료 | 메디플라톤',
  description: '상권분석 + 입지중개(수수료 0원) + PG 무료 설치 + 6개월 마케팅 무상 지원. PG 이용 약정만으로 개원에 필요한 모든 것을 0원으로.',
  keywords: ['개원 패키지', '개원 마케팅', '상권분석', '병원 개원', 'PG 설치', '중개수수료 무료', '메디플라톤'],
  openGraph: {
    title: '개원의 패키지 - 입지분석·중개·PG·마케팅 전부 무료 | 메디플라톤',
    description: '상권분석 + 입지중개(수수료 0원) + PG 무료 설치 + 6개월 마케팅 무상 지원. 초기 비용 0원.',
  },
}

export default function OpeningPackageLayout({ children }: { children: React.ReactNode }) {
  return children
}
