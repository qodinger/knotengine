"use client";

export function AffiliatesHeader() {
  return (
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight">
            Affiliate Program
          </h1>
          <div className="rounded border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-black tracking-widest text-emerald-500 uppercase">
            Earn 10%
          </div>
        </div>
        <p className="text-muted-foreground mt-1 text-sm">
          Partner with KnotEngine and earn a 10% commission on every credit
          top-up your affiliates make — forever.
        </p>
      </div>
    </div>
  );
}
