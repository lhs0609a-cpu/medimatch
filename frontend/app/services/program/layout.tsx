import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '직원 3명이 하던 일, 프로그램 하나가 27분에 끝냅니다 | DevAuto',
  description: '연간 1,200만원 절감. 150개 기업이 증명한 업무 자동화. PG 단말기 설치 조건 무료 제작. 손실 계산기 & 견적 계산기로 바로 확인하세요.',
  openGraph: {
    title: '직원 3명이 하던 일, 프로그램 하나가 27분에 끝냅니다 | DevAuto',
    description: '70% 시간 절감, 150+ 기업, 98% 재계약. 맞춤 자동화 프로그램.',
    url: 'https://medi.brandplaton.com/services/program',
  },
};

export default function ProgramServiceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
