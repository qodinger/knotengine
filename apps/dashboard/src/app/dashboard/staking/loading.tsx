import { Skeleton } from "@/components/ui/skeleton";

export default function StakingLoading() {
  return (
    <div className="flex flex-col gap-6 pb-10">
      {/* Header */}
      <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
        <div className="space-y-2">
          <Skeleton className="h-8 w-44" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-36 rounded-lg" />
          <Skeleton className="h-9 w-40 rounded-lg" />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="space-y-3 rounded-xl border border-white/5 bg-zinc-900/30 p-6"
          >
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-7 w-24" />
            <Skeleton className="h-3 w-32" />
          </div>
        ))}
      </div>

      {/* Why KnotEngine Staking Card */}
      <div className="space-y-5 rounded-xl border border-white/5 bg-zinc-900/30 p-6">
        <Skeleton className="h-5 w-48" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3">
              <Skeleton className="mt-0.5 h-4 w-4 shrink-0 rounded" />
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Staking Asset Cards */}
      <div className="mt-2 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="space-y-6 rounded-xl border border-white/5 bg-zinc-900/30 p-6"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-1.5">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            <Skeleton className="h-3 w-full" />
            <div className="grid grid-cols-2 gap-4 rounded-xl border border-white/5 bg-zinc-900/50 p-4">
              {Array.from({ length: 2 }).map((_, j) => (
                <div key={j} className="space-y-1.5">
                  <Skeleton className="h-2.5 w-14" />
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
            <div className="flex gap-3 pt-2">
              <Skeleton className="h-10 flex-1 rounded-lg" />
              <Skeleton className="h-10 flex-1 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
