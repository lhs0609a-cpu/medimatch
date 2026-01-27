import { pageSEO } from '@/lib/seo'

export const metadata = pageSEO.partners

export default function PartnersLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
