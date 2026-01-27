import { pageSEO } from '@/lib/seo'

export const metadata = pageSEO.pharmacyMatch

export default function PharmacyMatchLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
