import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '병원 홈페이지 무료제작 | 플라톤마케팅',
  description: '같은 광고비를 쓰는데 환자가 5배 오는 병원과 0인 병원의 차이. 4년간 170개 병의원의 전환율만 연구한 전문팀이 만듭니다. 제작비 0원, 월 구독료만.',
  openGraph: {
    title: '병원 홈페이지 무료제작 | 플라톤마케팅',
    description: '386% 신환 증가, 170+ 의료기관, 94% 장기계약. 제작비 0원으로 시작하세요.',
    url: 'https://medi.brandplaton.com/services/homepage',
  },
};

export default function HomepageServiceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
