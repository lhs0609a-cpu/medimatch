import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '업무 자동화 프로그램 무료제작 | DevAuto by 플라톤',
  description: '직원 3명이 하던 일, 프로그램 하나로 끝내세요. 매일 3시간씩 반복 작업에 낭비하고 계신가요? 귀사 맞춤 자동화 프로그램으로 업무시간 70% 단축. 150개 기업이 선택한 검증된 솔루션.',
  openGraph: {
    title: '업무 자동화 프로그램 무료제작 | DevAuto',
    description: '70% 시간 절감, 150+ 기업, 98% 재계약. 제작비 0원, 월 30만원.',
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
