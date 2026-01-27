import { pageSEO } from '@/lib/seo'

export const metadata = pageSEO.prospects

export default function ProspectsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
