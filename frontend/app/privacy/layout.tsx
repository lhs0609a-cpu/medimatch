import { pageSEO } from '@/lib/seo'

export const metadata = pageSEO.privacy

export default function PrivacyLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
