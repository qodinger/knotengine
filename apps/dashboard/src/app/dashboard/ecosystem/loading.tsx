import { Skeleton } from "@/components/ui/skeleton";

export default function EcosystemLoading() {
  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-36" />
        <Skeleton className="h-4 w-72" />
      </div>

      {/* Partner Cards Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="space-y-5 rounded-xl border border-white/5 bg-zinc-900/30 p-6"
          >
            <div className="flex items-start justify-between">
              <Skeleton className="h-12 w-12 rounded-2xl" />
              <Skeleton className="h-5 w-24 rounded-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-5/6" />
            </div>
            <Skeleton className="h-10 w-full rounded-xl" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        ))}
      </div>

      {/* Partnership CTA Card */}
      <div className="flex flex-col items-center space-y-4 rounded-xl border-2 border-dashed border-white/5 bg-zinc-900/20 py-16">
        <Skeleton className="h-12 w-12 rounded-full" />
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-6 w-52" />
        <Skeleton className="h-3 w-72" />
        <Skeleton className="mt-4 h-11 w-48 rounded-full" />
      </div>
    </div>
  );
}
