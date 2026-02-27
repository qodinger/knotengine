import { Skeleton } from "@/components/ui/skeleton";

export default function AffiliatesLoading() {
  return (
    <div className="flex min-w-0 flex-col gap-4 sm:gap-6">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-44" />
        <Skeleton className="h-4 w-72" />
      </div>

      <div className="flex min-w-0 flex-col gap-4 sm:gap-6">
        {/* Hero Card - Total Earned */}
        <div className="relative space-y-3 overflow-hidden rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-3">
              <Skeleton className="h-3 w-20 bg-emerald-500/10" />
              <Skeleton className="h-10 w-32 bg-emerald-500/10" />
            </div>
            <Skeleton className="h-12 w-12 rounded-xl bg-emerald-500/10" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-16 rounded-full bg-emerald-500/10" />
            <Skeleton className="h-3 w-48 bg-emerald-500/10" />
          </div>
        </div>

        {/* Secondary Stats - 3 Column Grid */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="space-y-2 rounded-xl border border-white/5 bg-zinc-900/50 p-3 sm:p-4"
            >
              <Skeleton className="h-2.5 w-14" />
              <Skeleton className="h-7 w-10" />
              <Skeleton className="h-2.5 w-12" />
            </div>
          ))}
        </div>

        {/* Two Column: Affiliate Link + How it Works */}
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {/* Affiliate Link Card */}
          <div className="space-y-5 rounded-xl border border-white/5 bg-zinc-900/30 p-6">
            <div className="mb-4 flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div className="space-y-1.5">
                <Skeleton className="h-5 w-36" />
                <Skeleton className="h-3 w-52" />
              </div>
            </div>
            {/* Incentive highlight */}
            <Skeleton className="h-16 w-full rounded-xl" />
            {/* Input + button */}
            <div className="flex gap-2">
              <Skeleton className="h-10 flex-1 rounded-lg" />
              <Skeleton className="h-10 w-24 rounded-lg" />
            </div>
            {/* Feature cards */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {Array.from({ length: 2 }).map((_, i) => (
                <div
                  key={i}
                  className="space-y-3 rounded-2xl border border-white/5 bg-white/2 p-5"
                >
                  <Skeleton className="h-10 w-10 rounded-xl" />
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
              ))}
            </div>
          </div>

          {/* How it Works Card */}
          <div className="space-y-5 rounded-xl border border-white/5 bg-zinc-900/30 p-6">
            <div className="space-y-1.5">
              <Skeleton className="h-5 w-56" />
              <Skeleton className="h-3 w-48" />
            </div>
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-start gap-4 p-3">
                  <Skeleton className="h-7 w-7 shrink-0 rounded-full" />
                  <Skeleton className="mt-2 h-3 w-full" />
                </div>
              ))}
            </div>
            <Skeleton className="h-28 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
