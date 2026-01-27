import { pageSEO } from '@/lib/seo'

export const metadata = pageSEO.simulate

export default function SimulateLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
