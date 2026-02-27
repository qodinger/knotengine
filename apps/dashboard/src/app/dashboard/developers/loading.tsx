import { Skeleton } from "@/components/ui/skeleton";

export default function DevelopersLoading() {
  return (
    <div className="flex min-w-0 flex-col gap-4 sm:gap-6">
      {/* Page Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="space-y-2">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-64" />
        </div>
        {/* Merchant ID input skeleton */}
        <div className="flex shrink-0 flex-col gap-1 lg:w-72">
          <Skeleton className="h-3 w-20" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 flex-1 rounded-lg" />
            <Skeleton className="h-9 w-9 rounded-lg" />
          </div>
        </div>
      </div>

      {/* Layout: left sub-nav + right content */}
      <div className="flex min-w-0 flex-col gap-4 sm:gap-6 lg:flex-row lg:gap-8">
        {/* Sub-nav sidebar skeleton */}
        <aside className="w-full min-w-0 lg:w-48 lg:shrink-0 xl:w-56">
          <div className="flex gap-2 lg:hidden">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-24 shrink-0 rounded-lg" />
            ))}
          </div>
          <div className="hidden flex-col gap-1 lg:flex">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-full rounded-lg" />
            ))}
          </div>
        </aside>

        {/* Content area */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-4 sm:gap-6">
            {/* API Keys Card */}
            <div className="space-y-5 rounded-xl border border-white/5 bg-zinc-900/30 p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1.5">
                  <Skeleton className="h-5 w-36" />
                  <Skeleton className="h-3 w-52" />
                </div>
                <Skeleton className="h-9 w-32 rounded-lg" />
              </div>
              <div className="space-y-3">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-4 rounded-xl border border-white/5 bg-zinc-900/50 p-4"
                  >
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-3 w-72" />
                    </div>
                    <div className="flex gap-2">
                      <Skeleton className="h-8 w-8 rounded-md" />
                      <Skeleton className="h-8 w-8 rounded-md" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
