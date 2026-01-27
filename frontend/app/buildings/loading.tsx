import { SkeletonBuildingCard, Skeleton } from '@/components/common/Skeleton'

export default function BuildingsLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Skeleton */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded-xl" />
              <div>
                <Skeleton className="h-6 w-32 mb-1" />
                <Skeleton className="h-4 w-48" />
              </div>
            </div>
            <Skeleton className="h-10 w-20 rounded-lg" />
          </div>

          {/* Search Skeleton */}
          <div className="mt-4">
            <Skeleton className="h-12 w-full rounded-lg" />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Results Count Skeleton */}
        <Skeleton className="h-4 w-32 mb-6" />

        {/* Grid Skeleton */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonBuildingCard key={i} />
          ))}
        </div>
      </main>
    </div>
  )
}
