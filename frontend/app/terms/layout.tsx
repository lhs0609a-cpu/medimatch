import { pageSEO } from '@/lib/seo'

export const metadata = pageSEO.terms

export default function TermsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
