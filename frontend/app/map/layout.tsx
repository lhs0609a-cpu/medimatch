import { pageSEO } from '@/lib/seo'

export const metadata = pageSEO.map

export default function MapLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
