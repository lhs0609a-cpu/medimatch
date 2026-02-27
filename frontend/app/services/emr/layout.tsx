import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '클라우드 EMR | PlatonEMR - 메디플라톤',
  description: '차트 쓰는 시간을 반으로, 환자 보는 시간을 두 배로. AI 음성인식, 클라우드 네이티브, 보험청구 자동화까지. 1개월 무료 체험.',
  openGraph: {
    title: '클라우드 EMR | PlatonEMR - 메디플라톤',
    description: '50% 차트시간 절감, 100+ 도입 의원, 97% 재계약률. 1개월 무료로 시작하세요.',
    url: 'https://medi.brandplaton.com/services/emr',
  },
};

export default function EMRServiceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
