import { Skeleton } from "@/components/ui/skeleton";

export default function SupportLoading() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8">
      {/* Hero Header + Search */}
      <div className="flex flex-col items-center space-y-2 py-8 text-center">
        <Skeleton className="h-9 w-72" />
        <Skeleton className="h-5 w-96" />
        <Skeleton className="mx-auto mt-6 h-14 w-full max-w-2xl rounded-lg" />
      </div>

      {/* Help Category Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="space-y-4 rounded-xl border border-white/5 bg-zinc-900/30 p-6"
          >
            <Skeleton className="h-12 w-12 rounded-xl" />
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-3/4" />
            <Skeleton className="h-4 w-28" />
          </div>
        ))}
      </div>

      {/* FAQ + Priority Support */}
      <div className="mt-4 grid grid-cols-1 gap-8 xl:grid-cols-2">
        {/* FAQs */}
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5 rounded" />
            <Skeleton className="h-5 w-52" />
          </div>
          <div className="grid gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-xl border border-white/5 bg-zinc-900/30 p-4"
              >
                <Skeleton className="h-4 w-64" />
                <Skeleton className="h-4 w-4 rounded" />
              </div>
            ))}
          </div>
          <Skeleton className="h-4 w-40" />
        </div>

        {/* Priority Support Card */}
        <div className="space-y-5 rounded-xl border border-white/5 bg-zinc-900/30 p-6">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-3 w-72" />
          <div className="space-y-4 rounded-xl border border-white/5 bg-zinc-900/50 p-4">
            <div className="space-y-1.5">
              <Skeleton className="h-2.5 w-28" />
              <Skeleton className="h-5 w-28 rounded-full" />
            </div>
            <Skeleton className="h-px w-full" />
            <div className="space-y-1.5">
              <Skeleton className="h-2.5 w-24" />
              <Skeleton className="h-4 w-36" />
            </div>
          </div>
          <Skeleton className="h-12 w-full rounded-lg" />
        </div>
      </div>

      {/* Enterprise CTA Bar */}
      <div className="mt-4 flex flex-col items-center justify-between gap-6 rounded-3xl border border-white/5 bg-zinc-900/20 p-8 md:flex-row">
        <div className="flex items-center gap-6">
          <Skeleton className="h-16 w-16 rounded-2xl" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-56" />
            <Skeleton className="h-3 w-72" />
          </div>
        </div>
        <Skeleton className="h-10 w-48 rounded-lg" />
      </div>
    </div>
  );
}
