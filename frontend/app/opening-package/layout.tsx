import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '개원의 패키지 - DSR-Free 대출 + 무료 마케팅 원스톱',
  description: '개원 중개 + DSR-Free 카드매출 담보대출 + 무료 마케팅(최대 1,970만원) + PG 단말기를 한 번에. 신협중앙회·KB국민카드 정식 제휴.',
  keywords: ['개원 대출', 'DSR-Free', '카드매출 담보대출', '개원 마케팅', '병원 개원 패키지', '메디플라톤', 'PG단말기'],
  openGraph: {
    title: '개원의 패키지 - DSR-Free 대출 + 무료 마케팅 원스톱 | 메디플라톤',
    description: '개원 중개 + DSR-Free 카드매출 담보대출 + 무료 마케팅(최대 1,970만원) + PG 단말기를 한 번에.',
  },
}

export default function OpeningPackageLayout({ children }: { children: React.ReactNode }) {
  return children
}
