import { SkeletonPartnerCard, Skeleton } from '@/components/common/Skeleton'

export default function PartnersLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Skeleton */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-xl" />
            <Skeleton className="h-6 w-24" />
          </div>
          <div className="hidden md:flex items-center gap-6">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
      </header>

      {/* Hero Skeleton */}
      <section className="bg-gradient-to-r from-violet-600 to-indigo-600 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <Skeleton className="h-10 w-80 mx-auto mb-4 bg-white/20" />
            <Skeleton className="h-6 w-96 mx-auto mb-2 bg-white/20" />
            <Skeleton className="h-6 w-72 mx-auto mb-8 bg-white/20" />
            <Skeleton className="h-14 w-full max-w-xl mx-auto rounded-2xl bg-white/30" />
          </div>
        </div>
      </section>

      {/* Categories Skeleton */}
      <section className="py-8 bg-white border-b">
        <div className="container mx-auto px-4">
          <div className="flex gap-3 overflow-hidden">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-24 rounded-full flex-shrink-0" />
            ))}
          </div>
        </div>
      </section>

      {/* Results Skeleton */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <Skeleton className="h-5 w-32" />
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-20 rounded-lg" />
              <Skeleton className="h-10 w-28 rounded-lg" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonPartnerCard key={i} />
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
