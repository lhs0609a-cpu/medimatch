import { Skeleton } from '@/components/common/Skeleton'

export default function SimulateLoading() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header Skeleton */}
      <header className="glass sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Skeleton className="w-5 h-5" />
              <div className="flex items-center gap-2">
                <Skeleton className="w-8 h-8 rounded-lg" />
                <Skeleton className="h-6 w-20" />
              </div>
            </div>
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 md:py-12">
        {/* Form Card Skeleton */}
        <div className="bg-card rounded-xl border border-border p-8 md:p-12">
          <div className="max-w-xl mx-auto">
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-5 w-80 mb-8" />

            {/* Form Fields */}
            <div className="space-y-6">
              <div>
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-12 w-full rounded-lg" />
              </div>

              <div>
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-12 w-full rounded-lg" />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Skeleton className="h-4 w-16 mb-2" />
                  <Skeleton className="h-12 w-full rounded-lg" />
                </div>
                <div>
                  <Skeleton className="h-4 w-20 mb-2" />
                  <Skeleton className="h-12 w-full rounded-lg" />
                </div>
              </div>

              <Skeleton className="h-12 w-full rounded-lg" />
            </div>

            <Skeleton className="h-4 w-72 mx-auto mt-6" />
          </div>
        </div>
      </main>
    </div>
  )
}
