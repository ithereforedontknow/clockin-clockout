import { Skeleton } from "@/components/ui/skeleton"

export function PageSkeleton() {
  return (
    <div className="animate-pulse space-y-8">
      {/* Header Skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-10 w-64 rounded-lg" />
        <Skeleton className="h-4 w-96 rounded-lg opacity-50" />
      </div>

      {/* KPI/Stats Row Skeleton */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <Skeleton
            key={i}
            className="h-28 w-full rounded-2xl border-none bg-muted/20 shadow-none"
          />
        ))}
      </div>

      {/* Main Content Area Skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-10 w-full max-w-sm rounded-xl" />
        <div className="overflow-hidden rounded-2xl border border-border/50 bg-card">
          <div className="border-b bg-muted/10 p-4">
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="p-0">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 border-b p-6">
                <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-1/2 opacity-50" />
                </div>
                <Skeleton className="h-8 w-20 rounded-lg" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
