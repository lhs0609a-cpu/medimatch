import { pageSEO } from '@/lib/seo'

export const metadata = pageSEO.contact

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
