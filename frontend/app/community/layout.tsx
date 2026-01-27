import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '커뮤니티',
  description: '개원, 약국 운영에 관한 정보를 공유하는 전문 커뮤니티. 의사, 약사, 전문가가 함께합니다.',
}

export default function CommunityLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
