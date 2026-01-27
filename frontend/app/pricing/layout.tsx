import { pageSEO } from '@/lib/seo'

export const metadata = pageSEO.pricing

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
