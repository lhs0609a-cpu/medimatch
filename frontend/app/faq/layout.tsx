import { pageSEO } from '@/lib/seo'

export const metadata = pageSEO.faq

export default function FaqLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
