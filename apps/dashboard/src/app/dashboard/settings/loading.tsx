import { Skeleton } from "@/components/ui/skeleton";

export default function SettingsLoading() {
  return (
    <div className="flex min-w-0 flex-col gap-4 sm:gap-6">
      {/* Page Header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-4 w-72" />
      </div>

      {/* Layout: left sub-nav + right content */}
      <div className="flex min-w-0 flex-col gap-4 sm:gap-6 lg:flex-row lg:gap-8">
        {/* Sub-nav sidebar skeleton */}
        <aside className="w-full min-w-0 lg:w-48 lg:shrink-0 xl:w-56">
          {/* Mobile: horizontal pills */}
          <div className="flex gap-2 lg:hidden">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-32 shrink-0 rounded-lg" />
            ))}
          </div>
          {/* Desktop: vertical nav */}
          <div className="hidden flex-col gap-1 lg:flex">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-full rounded-lg" />
            ))}
          </div>
        </aside>

        {/* Content area */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-4 sm:gap-6">
            {/* Merchant Details Card */}
            <div className="space-y-6 rounded-xl border border-white/5 bg-zinc-900/30 p-6">
              <div className="space-y-1.5">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-3 w-56" />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-10 w-full rounded-lg" />
                  </div>
                ))}
              </div>
              <Skeleton className="h-10 w-32 rounded-lg" />
            </div>

            {/* Appearance Card */}
            <div className="space-y-6 rounded-xl border border-white/5 bg-zinc-900/30 p-6">
              <div className="space-y-1.5">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-10 w-full rounded-lg" />
                  </div>
                ))}
              </div>
              <Skeleton className="h-10 w-32 rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
