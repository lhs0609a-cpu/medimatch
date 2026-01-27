import { pageSEO } from '@/lib/seo'

export const metadata = pageSEO.buildings

export default function BuildingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
