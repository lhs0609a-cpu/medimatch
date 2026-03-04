import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'PG 설치하면 병원 홈페이지 무료 제작 | 플라톤마케팅',
  description: 'PG 단말기만 설치하시면 병원 홈페이지를 무료로 제작해드립니다. 반응형 디자인, 맞춤 브랜딩, 유지보수까지 0원.',
  openGraph: {
    title: 'PG 설치하면 병원 홈페이지 무료 제작 | 플라톤마케팅',
    description: 'PG 단말기만 설치하시면 병원 홈페이지를 무료로 제작해드립니다.',
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
