import { pageSEO } from '@/lib/seo'

export const metadata = pageSEO.dashboard

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
